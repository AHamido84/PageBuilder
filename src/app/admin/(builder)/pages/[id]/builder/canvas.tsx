"use client";

import { useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { LayoutTemplate } from "lucide-react";
import { CanvasSectionFrame } from "./canvas-section-frame";
import type { BuilderSection, EditorLocale } from "@/lib/page-builder/types";

interface Props {
  sections: BuilderSection[];
  selectedId: string | null;
  mode: "select" | "preview";
  locale: EditorLocale;
  device: "mobile" | "tablet" | "desktop";
  onSelect: (id: string) => void;
  onReorder: (nextOrderIds: string[]) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleVisible: (id: string) => void;
  /** PHASE 10: public URL of this page's saved draft (?preview=draft) -- shown in Preview mode. */
  previewUrl?: string;
  /** Bumped after every successful save so the preview iframe reloads. */
  previewVersion?: number;
}

const DEVICE_WIDTH: Record<Props["device"], string> = { mobile: "max-w-sm", tablet: "max-w-3xl", desktop: "max-w-none" };
// PHASE 10 true device preview: real device widths for the iframe, so the page's own breakpoints apply.
const DEVICE_FRAME_WIDTH: Record<Props["device"], string> = { mobile: "390px", tablet: "820px", desktop: "100%" };

export function Canvas({ sections, selectedId, mode, locale, device, onSelect, onReorder, onDuplicate, onDelete, onToggleVisible, previewUrl, previewVersion = 0 }: Props) {
  // Keyboard too: focus a section's drag handle, Space to pick up, arrow keys to move, Space to drop.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Brings the selected section into view regardless of where it was selected from -- the layer
  // list (which can select a section that's currently scrolled out of view entirely) or the canvas
  // itself (already in view, so this is a harmless no-op there). `id={section.id}` on each section's
  // root div (canvas-section-frame.tsx) is what this targets.
  useEffect(() => {
    if (!selectedId) return;
    document.getElementById(selectedId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedId]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(sections, oldIndex, newIndex).map((s) => s.id));
  }

  // PHASE 10: Preview mode renders the real saved draft page in an iframe at the chosen device width.
  // Unlike the editing canvas (which narrows its width but whose responsive styles still follow the
  // admin's browser window), the iframe is its own viewport -- mobile/tablet breakpoints are exact.
  // It reloads after every successful save (previewVersion).
  if (mode === "preview" && previewUrl) {
    const src = `${previewUrl}${previewUrl.includes("?") ? "&" : "?"}_v=${previewVersion}`;
    return (
      <div className="flex h-full flex-col items-center gap-2 bg-neutral-900/40 p-4">
        <p className="text-[11px] text-neutral-500">
          Exact {device} preview of the saved draft ({DEVICE_FRAME_WIDTH[device] === "100%" ? "full width" : DEVICE_FRAME_WIDTH[device]}) — refreshes after each save.
        </p>
        <iframe
          key={`${device}-${locale}`}
          title="Device preview"
          src={src}
          className="min-h-0 flex-1 rounded-lg border border-neutral-800 bg-white shadow-2xl"
          style={{ width: DEVICE_FRAME_WIDTH[device], maxWidth: "100%" }}
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-neutral-900/40 p-6">
      {device !== "desktop" ? (
        <p className="mx-auto mb-2 max-w-3xl text-center text-[11px] text-neutral-500">
          Editing at {device} width. Breakpoint-specific styles follow your browser window here — switch to <span className="text-neutral-300">Preview</span> for an exact {device} render.
        </p>
      ) : null}
      <div className={`mx-auto rounded-lg border border-neutral-800 bg-white text-ink shadow-2xl transition-[max-width] ${DEVICE_WIDTH[device]}`} dir={locale === "ar" ? "rtl" : "ltr"}>
        {sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-32 text-center text-neutral-400">
            <LayoutTemplate size={32} />
            <p className="text-sm">No sections yet — add one from the left panel.</p>
          </div>
        ) : (
          <DndContext id="page-builder-canvas" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {sections.map((section) => (
                <CanvasSectionFrame
                  key={section.id}
                  section={section}
                  selected={section.id === selectedId}
                  mode={mode}
                  locale={locale}
                  onSelect={() => onSelect(section.id)}
                  onDuplicate={() => onDuplicate(section.id)}
                  onDelete={() => onDelete(section.id)}
                  onToggleVisible={() => onToggleVisible(section.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
