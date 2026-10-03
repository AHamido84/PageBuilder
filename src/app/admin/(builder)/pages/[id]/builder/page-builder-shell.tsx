"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getBlock } from "@/lib/page-builder/registry";
import { ReferenceDataProvider, type ReferenceData } from "@/lib/page-builder/reference-data-context";
import type { BuilderSection, Breakpoint, EditorLocale, SectionSettings } from "@/lib/page-builder/types";
import { useAdminToast } from "@/components/admin/ui/toast";
import { useConfirm } from "@/components/admin/ui/confirm-dialog";
import { publicPathForPageSlug } from "@/lib/page-builder/public-path";
import type { SaveStatus } from "@/components/admin/ui/status-label";
import { Toolbar } from "./toolbar";
import { ComponentPanel } from "./component-panel";
import { Canvas } from "./canvas";
import { SettingsPanel } from "./settings-panel";
import { RevisionHistoryPanel, type RevisionListItem } from "./revision-history-panel";
import { usePageBuilderHistory } from "./use-page-builder-history";
import { saveDraftAction, publishPageAction } from "./actions";
import type { DraftState } from "@/lib/page-builder/draft-state";

interface Props {
  pageId: string;
  slug: string;
  /** PHASE 8: the page's English title, shown in the toolbar when set. */
  title?: string | null;
  /** PHASE 10: server fingerprint of the stored draft + whether it differs from the live page. */
  initialDraftState: DraftState;
  initialStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  initialSections: BuilderSection[];
  initialRevisions: RevisionListItem[];
  referenceData: ReferenceData;
}

export function PageBuilderShell({ pageId, slug, title, initialDraftState, initialStatus, initialSections, initialRevisions, referenceData }: Props) {
  const router = useRouter();
  const toast = useAdminToast();
  const confirm = useConfirm();
  const { present: sections, commit, undo, redo, canUndo, canRedo } = usePageBuilderHistory<BuilderSection[]>(initialSections);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [device, setDevice] = useState<Breakpoint>("desktop");
  const [mode, setMode] = useState<"select" | "preview">("select");
  const [editorLocale, setEditorLocale] = useState<EditorLocale>("en");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [pageStatus, setPageStatus] = useState(initialStatus);
  const revisions = initialRevisions;
  const [revisionsOpen, setRevisionsOpen] = useState(false);
  const [publishing, startPublishTransition] = useTransition();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionsRef = useRef(sections);
  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);
  // Set right before a deliberate window.location.reload() (e.g. after a
  // revision restore) so the in-flight/beforeunload autosave -- which would
  // otherwise persist this component's stale in-memory `sections`, since a
  // restore mutates the DB directly without updating client state -- doesn't
  // fire and clobber the just-restored content during the reload.
  const suppressAutosaveRef = useRef(false);

  // PHASE 10 safe autosave. Saves never overlap (a save requested while one is in flight is queued
  // and runs right after with the newest content, so an older request can never land last), and
  // every save carries the fingerprint of the draft this editor last loaded/saved -- the server
  // refuses it if someone else changed the draft in the meantime, and autosave stops until reload.
  // Autosave only ever writes the DRAFT; the live page changes only on Publish.
  const baseDraftHashRef = useRef(initialDraftState.draftHash);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(initialDraftState.hasUnpublishedChanges);
  // Bumped after each successful save/publish so Preview mode's device iframe reloads (PHASE 10).
  const [previewVersion, setPreviewVersion] = useState(0);
  const conflictRef = useRef(false);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const queuedRef = useRef(false);

  const save = useCallback(async (): Promise<void> => {
    if (suppressAutosaveRef.current || conflictRef.current) return;
    if (inFlightRef.current) {
      queuedRef.current = true;
      return inFlightRef.current;
    }
    const run = async () => {
      do {
        queuedRef.current = false;
        setSaveStatus("saving");
        const result = await saveDraftAction(pageId, sectionsRef.current, baseDraftHashRef.current);
        if (result.success) {
          if (result.draftHash) baseDraftHashRef.current = result.draftHash;
          if (typeof result.hasUnpublishedChanges === "boolean") setHasUnpublishedChanges(result.hasUnpublishedChanges);
          setPreviewVersion((v) => v + 1);
          setSaveStatus("saved");
        } else if (result.conflict) {
          conflictRef.current = true;
          if (debounceRef.current) clearTimeout(debounceRef.current);
          setSaveStatus("conflict");
          toast.push({ title: "Not saved — this page changed elsewhere", description: result.error, tone: "error" });
          return;
        } else {
          setSaveStatus("error");
          toast.push({ title: result.error ?? "Save failed.", tone: "error" });
          return;
        }
      } while (queuedRef.current);
    };
    inFlightRef.current = run().finally(() => {
      inFlightRef.current = null;
    });
    return inFlightRef.current;
  }, [pageId, toast]);

  // The exact array the editor opened with (already persisted).
  const loadedSectionsRef = useRef(sections);
  useEffect(() => {
    // Skip while `sections` is still the array the page loaded with: there's nothing to save yet.
    // Scheduling a needless autosave here left a stale-data timer armed right after every page
    // load, which could fire mid-navigation and clobber a just-restored revision if Restore was
    // clicked shortly after the page opened. Compared by reference (PHASE 10) rather than a
    // "first render" flag, which React's dev double-invoked effects defeated.
    if (sections === loadedSectionsRef.current) return;
    setSaveStatus("dirty");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(save, 1800);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  useEffect(() => {
    function onBeforeUnload() {
      save();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [save]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  function addBlock(type: string, preset?: Record<string, unknown>) {
    const block = getBlock(type);
    if (!block) return;
    const withPreset = (data: unknown) => (preset ? { ...(data as Record<string, unknown>), ...structuredClone(preset) } : data);
    const newSection: BuilderSection = {
      id: crypto.randomUUID(),
      type,
      order: sections.length,
      dataEn: withPreset(structuredClone(block.defaultData.en)),
      dataAr: withPreset(structuredClone(block.defaultData.ar)),
      // Each locale starts from the same default style settings but is stored as its own
      // independent copy from the moment a section is created -- see the LocaleSectionSettings
      // migration/fallback note in types.ts.
      settings: { en: structuredClone(block.defaultSettings), ar: structuredClone(block.defaultSettings) },
      isVisible: true,
    };
    commit((prev) => [...prev, newSection]);
    setSelectedId(newSection.id);
  }

  function reorder(nextOrderIds: string[]) {
    commit((prev) => nextOrderIds.map((id) => prev.find((s) => s.id === id)!).filter(Boolean));
  }

  function duplicate(id: string) {
    commit((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const copy: BuilderSection = { ...structuredClone(prev[idx]), id: crypto.randomUUID() };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }

  async function previewDraft(locale: "en" | "ar") {
    // Open the tab synchronously (inside the click) so pop-up blockers allow it, then point it at
    // the draft once the latest edits are saved -- the preview always shows what was just edited.
    const tab = window.open("about:blank", "_blank");
    await save();
    const url = `/${locale}${publicPathForPageSlug(slug)}?preview=draft`;
    if (tab) tab.location.href = url;
    else toast.push({ title: "Pop-up blocked", description: `Allow pop-ups for this site, or open ${url} yourself.`, tone: "error" });
  }

  async function remove(id: string) {
    const label = getBlock(sections.find((s) => s.id === id)?.type ?? "")?.label ?? "this section";
    const ok = await confirm({
      title: `Delete ${label}?`,
      description: "The section is removed from the draft. You can undo (Ctrl+Z) before saving; the live page doesn't change until you publish.",
      confirmLabel: "Delete section",
      danger: true,
    });
    if (!ok) return;
    commit((prev) => prev.filter((s) => s.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function toggleVisible(id: string) {
    commit((prev) => prev.map((s) => (s.id === id ? { ...s, isVisible: !s.isVisible } : s)));
  }

  function updateData(locale: "en" | "ar", data: unknown) {
    if (!selectedId) return;
    commit((prev) => prev.map((s) => (s.id === selectedId ? { ...s, [locale === "ar" ? "dataAr" : "dataEn"]: data } : s)), { debounce: true });
  }

  /** Updates ONLY the given locale's style settings -- never the other locale's. */
  function updateSettings(locale: EditorLocale, next: SectionSettings) {
    if (!selectedId) return;
    commit(
      (prev) => prev.map((s) => (s.id === selectedId ? { ...s, settings: { ...s.settings, [locale]: next } } : s)),
      { debounce: true }
    );
  }

  function handlePublish() {
    startPublishTransition(async () => {
      await save();
      // Never publish over a conflicting draft -- the editor must reload and review first.
      if (conflictRef.current) {
        toast.push({ title: "Not published", description: "This page changed elsewhere. Reload to get the latest version, then publish.", tone: "error" });
        return;
      }
      const result = await publishPageAction(pageId);
      if (result.success) {
        if (result.draftHash) baseDraftHashRef.current = result.draftHash;
        setHasUnpublishedChanges(Boolean(result.hasUnpublishedChanges));
        setPageStatus("PUBLISHED");
        toast.push({ title: "Page published.", tone: "success" });
        router.refresh();
      } else {
        toast.push({ title: result.error ?? "Publish failed.", tone: "error" });
      }
    });
  }

  const selectedSection = sections.find((s) => s.id === selectedId) ?? null;

  return (
    <ReferenceDataProvider value={referenceData}>
      <div className="flex h-full flex-col">
        <Toolbar
          pageId={pageId}
          slug={slug}
          title={title}
          pageStatus={pageStatus}
          hasUnpublishedChanges={hasUnpublishedChanges}
          onPreviewDraft={previewDraft}
          saveStatus={saveStatus}
          device={device}
          onDeviceChange={setDevice}
          mode={mode}
          onModeChange={(next) => {
            setMode(next);
            // Entering Preview flushes pending edits first, so the device preview shows them.
            if (next === "preview") void save();
          }}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onSave={save}
          onPublish={handlePublish}
          publishing={publishing}
          onOpenRevisions={() => setRevisionsOpen(true)}
        />
        <div className="grid flex-1 grid-cols-[240px_1fr_320px] overflow-hidden">
          <ComponentPanel
            sections={sections}
            selectedId={selectedId}
            onAdd={addBlock}
            onSelect={setSelectedId}
            onToggleVisible={toggleVisible}
            locale={editorLocale}
            onReorder={reorder}
            onDuplicate={duplicate}
            onDelete={remove}
          />
          <Canvas
            sections={sections}
            selectedId={selectedId}
            mode={mode}
            locale={editorLocale}
            device={device}
            onSelect={setSelectedId}
            onReorder={reorder}
            onDuplicate={duplicate}
            onDelete={remove}
            onToggleVisible={toggleVisible}
            previewUrl={`/${editorLocale}${publicPathForPageSlug(slug)}?preview=draft`}
            previewVersion={previewVersion}
          />
          {selectedSection ? (
            <SettingsPanel
              section={selectedSection}
              device={device}
              onDeviceChange={setDevice}
              locale={editorLocale}
              onLocaleChange={setEditorLocale}
              onUpdateData={updateData}
              onUpdateSettings={updateSettings}
            />
          ) : (
            <div className="border-s border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-500">Select a section to edit it.</div>
          )}
        </div>
      </div>
      <RevisionHistoryPanel
        open={revisionsOpen}
        onClose={() => setRevisionsOpen(false)}
        pageId={pageId}
        revisions={revisions}
        onRestored={() => {
          // Cancel any pending/future autosave -- including the beforeunload
          // handler's save() call, which fires during the reload navigation
          // below and would otherwise persist this component's stale
          // pre-restore `sections` right back over the just-restored content.
          suppressAutosaveRef.current = true;
          if (debounceRef.current) clearTimeout(debounceRef.current);
          // A full reload, not router.refresh(): the shell's undo/redo history
          // and section state are client-only (usePageBuilderHistory reads
          // `initialSections` just once, on mount) and won't pick up a
          // server-refetched prop otherwise. Restore is a deliberate, rare
          // action -- resetting the whole editor session is the correct
          // behavior here, not just a workaround.
          window.location.reload();
        }}
      />
    </ReferenceDataProvider>
  );
}
