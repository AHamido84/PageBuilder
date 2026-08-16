"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getBlock } from "@/lib/page-builder/registry";
import { ReferenceDataProvider, type ReferenceData } from "@/lib/page-builder/reference-data-context";
import type { BuilderSection, Breakpoint, EditorLocale, SectionSettings } from "@/lib/page-builder/types";
import { useAdminToast } from "@/components/admin/ui/toast";
import type { SaveStatus } from "@/components/admin/ui/status-label";
import { Toolbar } from "./toolbar";
import { ComponentPanel } from "./component-panel";
import { Canvas } from "./canvas";
import { SettingsPanel } from "./settings-panel";
import { RevisionHistoryPanel, type RevisionListItem } from "./revision-history-panel";
import { usePageBuilderHistory } from "./use-page-builder-history";
import { saveDraftAction, publishPageAction } from "./actions";

interface Props {
  pageId: string;
  slug: string;
  initialStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  initialSections: BuilderSection[];
  initialRevisions: RevisionListItem[];
  referenceData: ReferenceData;
}

export function PageBuilderShell({ pageId, slug, initialStatus, initialSections, initialRevisions, referenceData }: Props) {
  const router = useRouter();
  const toast = useAdminToast();
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

  const save = useCallback(async () => {
    if (suppressAutosaveRef.current) return;
    setSaveStatus("saving");
    const result = await saveDraftAction(pageId, sectionsRef.current);
    if (result.success) {
      setSaveStatus("saved");
    } else {
      setSaveStatus("error");
      toast.push({ title: result.error ?? "Save failed.", tone: "error" });
    }
  }, [pageId, toast]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    // Skip on the very first mount: `sections` starts at `initialSections`
    // (already persisted), so there's nothing to save yet. Scheduling a
    // needless autosave here left a stale-data timer armed right after every
    // page load, which could fire mid-navigation and clobber a just-restored
    // revision if Restore was clicked shortly after the page opened.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
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

  function addBlock(type: string) {
    const block = getBlock(type);
    if (!block) return;
    const newSection: BuilderSection = {
      id: crypto.randomUUID(),
      type,
      order: sections.length,
      dataEn: structuredClone(block.defaultData.en),
      dataAr: structuredClone(block.defaultData.ar),
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

  function remove(id: string) {
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
      const result = await publishPageAction(pageId);
      if (result.success) {
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
          pageStatus={pageStatus}
          saveStatus={saveStatus}
          device={device}
          onDeviceChange={setDevice}
          mode={mode}
          onModeChange={setMode}
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
          <ComponentPanel sections={sections} selectedId={selectedId} onAdd={addBlock} onSelect={setSelectedId} onToggleVisible={toggleVisible} />
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
          />
          {selectedSection ? (
            <SettingsPanel
              section={selectedSection}
              device={device}
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
