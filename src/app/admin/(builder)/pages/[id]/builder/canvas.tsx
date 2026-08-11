"use client";

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
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
}

const DEVICE_WIDTH: Record<Props["device"], string> = { mobile: "max-w-sm", tablet: "max-w-3xl", desktop: "max-w-none" };

export function Canvas({ sections, selectedId, mode, locale, device, onSelect, onReorder, onDuplicate, onDelete, onToggleVisible }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(sections, oldIndex, newIndex).map((s) => s.id));
  }

  return (
    <div className="h-full overflow-y-auto bg-neutral-900/40 p-6">
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
