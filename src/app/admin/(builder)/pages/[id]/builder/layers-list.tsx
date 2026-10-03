"use client";

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, Eye, EyeOff, GripVertical, Trash2 } from "lucide-react";
import { getBlock } from "@/lib/page-builder/registry";
import type { BuilderSection, EditorLocale } from "@/lib/page-builder/types";

/** The first human-readable text a section carries (heading/headline/title/...), so the layer list
 * says *which* "Product Grid" this is ("Featured products"), not just its block type. */
function sectionSnippet(section: BuilderSection, locale: EditorLocale): string {
  const data = (locale === "ar" ? section.dataAr : section.dataEn) as Record<string, unknown> | null;
  if (!data || typeof data !== "object") return "";
  for (const key of ["heading", "headline", "title", "eyebrow", "text", "label"]) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  // Slideshow/carousel Heroes keep their text on the first slide.
  const slides = data.slides;
  if (Array.isArray(slides) && slides[0] && typeof slides[0] === "object") {
    const headline = (slides[0] as Record<string, unknown>).headline;
    if (typeof headline === "string" && headline.trim()) return headline.trim();
  }
  if (typeof data.html === "string") return data.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return "";
}

interface Props {
  sections: BuilderSection[];
  selectedId: string | null;
  locale: EditorLocale;
  onSelect: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onReorder: (nextOrderIds: string[]) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

/** Redesign PHASE 10: the left "Layers" navigator -- drag (or keyboard: focus the handle, Space,
 * arrows, Space) to reorder; same commit path as the canvas's own drag-and-drop, so it's undoable. */
export function LayersList({ sections, selectedId, locale, onSelect, onToggleVisible, onReorder, onDuplicate, onDelete }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = sections.map((s) => s.id);
    onReorder(arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  }

  if (sections.length === 0) return <p className="p-2 text-xs text-neutral-500">No sections yet.</p>;

  return (
    <DndContext id="page-builder-layers" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <ol className="space-y-1" aria-label="Page sections">
          {sections.map((section, i) => (
            <LayerRow
              key={section.id}
              section={section}
              index={i}
              locale={locale}
              selected={section.id === selectedId}
              onSelect={onSelect}
              onToggleVisible={onToggleVisible}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}

function LayerRow({
  section,
  index,
  locale,
  selected,
  onSelect,
  onToggleVisible,
  onDuplicate,
  onDelete,
}: {
  section: BuilderSection;
  index: number;
  locale: EditorLocale;
  selected: boolean;
  onSelect: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const block = getBlock(section.type);
  const label = block?.label ?? section.type;
  const snippet = sectionSnippet(section, locale);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "relative z-10 opacity-80" : undefined}
      data-layer-id={section.id}
    >
      <div
        className={`group flex items-center gap-1.5 rounded-md border px-1.5 py-1.5 text-xs ${
          selected ? "border-blue-500 bg-blue-500/10 text-neutral-100" : "border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700"
        }`}
      >
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Drag to reorder ${label}`}
          className="shrink-0 cursor-grab touch-none rounded p-0.5 text-neutral-600 hover:text-neutral-300 active:cursor-grabbing"
        >
          <GripVertical size={13} />
        </button>
        <button type="button" onClick={() => onSelect(section.id)} className="flex min-w-0 flex-1 items-center gap-1.5 text-start">
          <span className="text-[10px] tabular-nums text-neutral-600">{index + 1}</span>
          {block?.icon ? <block.icon size={13} className="shrink-0 text-neutral-500" /> : null}
          <span className={`min-w-0 ${section.isVisible ? "" : "opacity-50"}`}>
            <span className="block truncate">{label}</span>
            {snippet ? (
              <span className="block truncate text-[10px] text-neutral-500" dir={locale === "ar" ? "rtl" : "ltr"}>
                {snippet}
              </span>
            ) : null}
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-0.5 opacity-60 group-hover:opacity-100">
          <button type="button" onClick={() => onToggleVisible(section.id)} className="rounded p-0.5 text-neutral-500 hover:text-neutral-200" title={section.isVisible ? "Hide" : "Show"} aria-label={section.isVisible ? `Hide ${label}` : `Show ${label}`}>
            {section.isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>
          <button type="button" onClick={() => onDuplicate(section.id)} className="rounded p-0.5 text-neutral-500 hover:text-neutral-200" title="Duplicate" aria-label={`Duplicate ${label}`}>
            <Copy size={13} />
          </button>
          <button type="button" onClick={() => onDelete(section.id)} className="rounded p-0.5 text-neutral-500 hover:text-red-400" title="Delete" aria-label={`Delete ${label}`}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </li>
  );
}
