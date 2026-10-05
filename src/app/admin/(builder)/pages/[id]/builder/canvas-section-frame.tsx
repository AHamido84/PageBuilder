"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, Eye, EyeOff, GripVertical, Trash2 } from "lucide-react";
import { getBlock } from "@/lib/page-builder/registry";
import { isRequiredSection } from "@/lib/page-builder/system-pages";
import { useBuilderPage } from "./builder-page-context";
import { SectionShell } from "@/lib/page-builder/section-shell";
import type { BuilderSection, EditorLocale } from "@/lib/page-builder/types";
import { IconButton } from "@/components/admin/ui/icon-button";

interface Props {
  section: BuilderSection;
  selected: boolean;
  mode: "select" | "preview";
  locale: EditorLocale;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleVisible: () => void;
}

export function CanvasSectionFrame({ section, selected, mode, locale, onSelect, onDuplicate, onDelete, onToggleVisible }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const block = getBlock(section.type);
  const required = isRequiredSection(section.type, useBuilderPage().slug);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : section.isVisible ? 1 : 0.4,
  };

  if (!block) {
    return (
      <div ref={setNodeRef} style={style} className="border-y border-dashed border-red-800 bg-red-950/30 p-6 text-sm text-red-300">
        Unknown block type &ldquo;{section.type}&rdquo; — this section can&apos;t be rendered. Delete it and add a supported block instead.
      </div>
    );
  }

  const data = (locale === "ar" ? section.dataAr : section.dataEn) as never;
  const localeSettings = section.settings[locale];
  const isPreview = mode === "preview";

  return (
    <div
      id={section.id}
      ref={setNodeRef}
      style={style}
      className={`group relative ${selected && !isPreview ? "outline outline-2 outline-offset-[-2px] outline-blue-500" : ""}`}
    >
      {!isPreview ? (
        <div
          role="button"
          tabIndex={0}
          onClickCapture={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect();
          }}
          className="absolute inset-0 z-10 cursor-pointer"
        />
      ) : null}

      {!isPreview ? (
        <div className={`absolute -top-3 start-3 z-20 flex items-center gap-0.5 rounded-md border border-neutral-700 bg-neutral-900 p-0.5 shadow-lg ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
          <span {...attributes} {...listeners} className="flex h-7 w-7 cursor-grab items-center justify-center text-neutral-500 hover:text-neutral-200 active:cursor-grabbing">
            <GripVertical size={14} />
          </span>
          <span className="px-1.5 text-xs text-neutral-400">{block.label}</span>
          {required ? null : <IconButton icon={Copy} label="Duplicate" onClick={(e) => { e.stopPropagation(); onDuplicate(); }} />}
          <IconButton icon={section.isVisible ? Eye : EyeOff} label={section.isVisible ? "Hide" : "Show"} onClick={(e) => { e.stopPropagation(); onToggleVisible(); }} />
          {required ? <span className="px-1.5 text-[10px] text-amber-300">مطلوب</span> : <IconButton icon={Trash2} label="Delete" danger onClick={(e) => { e.stopPropagation(); onDelete(); }} />}
        </div>
      ) : null}

      {/* Phase 2 fix: this was previously always omitted, so a bleeding block (e.g. Hero in
          full-bleed layout mode) rendered inside the canvas's normal max-width/padding box even
          though the public site correctly rendered it edge-to-edge -- a real WYSIWYG gap. Passing
          the same bleedsWhen result the public SectionRenderer already computes makes the canvas
          match; it's also what makes the new Container Width setting (which only has an effect
          when NOT bleeding) actually previewable while editing. */}
      <SectionShell settings={localeSettings} bleed={block.bleedsWhen?.(data) ?? false}>
        {block.canvasPreview ? <block.canvasPreview data={data} /> : <block.Render data={data} locale={locale} interactive={isPreview} settings={localeSettings} />}
      </SectionShell>
    </div>
  );
}
