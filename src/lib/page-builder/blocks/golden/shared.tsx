"use client";

import { ArrowRight, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { MediaPickerControlled } from "@/components/admin/ui/media-picker-field";
import { cn } from "@/lib/cn";
import { resolveHref } from "../../href";
import type { MediaRef } from "../../types";

/**
 * Golden Seven home v7 -- shared pieces for the G7_* blocks (design-assets/reference). These blocks
 * own their full-width composition (bleedsWhen: always) and read the fixed --g7-* tokens from
 * globals.css, so the section looks like the design regardless of section Style settings.
 */

/** Design content column: 1920 artboard with 130px side margins (.g7-container, fluid; 16px min on phones). */
export function G7Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("g7-container", className)}>{children}</div>;
}

/** "Forward" arrow: points left in Arabic, right in English. */
export function G7Arrow({ className, size = 18 }: { className?: string; size?: number }) {
  return <ArrowRight size={size} strokeWidth={1.6} aria-hidden="true" className={cn("shrink-0 rtl:-scale-x-100", className)} />;
}

/** Like resolveHref, but in-page anchors ("#quote") stay anchors instead of becoming "/ar/#quote". */
export function g7Href(url: string, locale: string): string {
  if (!url) return `/${locale}`;
  if (url.startsWith("#")) return url;
  return resolveHref(url, locale);
}

/** Section headings and eyebrow labels (sizes from the 1920 artboard, see .g7-* in globals.css). */
export const g7H2 = "t-h2";
export const g7Eyebrow = "t-ui font-medium text-[var(--g7-gold-500)]";
/** Gold primary button, radius 6px, design 248x58. */
export const g7GoldButton =
  "g7-btn-text inline-flex min-h-[clamp(3rem,3vw,3.625rem)] items-center justify-center gap-[clamp(0.75rem,1.4vw,1.75rem)] rounded-[6px] bg-[var(--g7-gold-600)] px-[clamp(1.5rem,1.9vw,2.25rem)] leading-none text-[var(--g7-cream-50)] transition-colors hover:bg-[#98691d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--g7-cream-50)]";
export const g7OutlineButton =
  "g7-btn-text inline-flex min-h-[clamp(3rem,3vw,3.625rem)] items-center justify-center gap-[clamp(0.75rem,1.4vw,1.75rem)] rounded-[6px] border border-[var(--g7-cream-50)]/80 px-[clamp(1.5rem,1.9vw,2.25rem)] font-medium leading-none text-[var(--g7-cream-50)] transition-colors hover:bg-[var(--g7-cream-50)] hover:text-[var(--g7-teal-900)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--g7-gold-500)]";

/* -------------------------------------------------------------------------------------------------
 * Admin edit helpers
 * -----------------------------------------------------------------------------------------------*/

export function G7ImageField({ label, value, onChange }: { label: string; value: MediaRef | null; onChange: (next: MediaRef | null) => void }) {
  return (
    <MediaPickerControlled
      label={label}
      mediaId={value?.id ?? ""}
      previewUrl={value?.url}
      uploadFolderName="Banners"
      onChange={(id, url) => onChange(id && url ? { id, url } : null)}
    />
  );
}

/** Ordered list editor: add / remove / move up / move down, with a caller-rendered item body. */
export function G7ListEditor<T>({
  label,
  items,
  onChange,
  createItem,
  renderItem,
  itemLabel,
  max = 12,
}: {
  label: string;
  items: T[];
  onChange: (next: T[]) => void;
  createItem: () => T;
  renderItem: (item: T, update: (next: T) => void) => React.ReactNode;
  itemLabel: (item: T, index: number) => string;
  max?: number;
}) {
  function move(index: number, delta: number) {
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(index + delta, 0, moved);
    onChange(next);
  }
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</p>
      {items.map((item, index) => (
        <details key={index} className="rounded-md border border-neutral-700 bg-neutral-900/40">
          <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm text-neutral-200">
            <span className="truncate">{itemLabel(item, index) || `#${index + 1}`}</span>
            <span className="flex shrink-0 items-center gap-1" onClick={(e) => e.preventDefault()}>
              <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)} className="rounded p-1 text-neutral-400 hover:bg-neutral-800 disabled:opacity-30">
                <ChevronUp size={14} />
              </button>
              <button type="button" aria-label="Move down" disabled={index === items.length - 1} onClick={() => move(index, 1)} className="rounded p-1 text-neutral-400 hover:bg-neutral-800 disabled:opacity-30">
                <ChevronDown size={14} />
              </button>
              <button type="button" aria-label="Remove" onClick={() => onChange(items.filter((_, i) => i !== index))} className="rounded p-1 text-neutral-500 hover:bg-neutral-800 hover:text-red-400">
                <Trash2 size={14} />
              </button>
            </span>
          </summary>
          <div className="space-y-3 border-t border-neutral-800 p-3">
            {renderItem(item, (next) => onChange(items.map((it, i) => (i === index ? next : it))))}
          </div>
        </details>
      ))}
      {items.length < max ? (
        <button
          type="button"
          onClick={() => onChange([...items, createItem()])}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-neutral-700 px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-800"
        >
          <Plus size={14} /> Add
        </button>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Text-on-photo position (hero, banner, quote image, category cards)
 * -----------------------------------------------------------------------------------------------*/

export type G7TextX = "left" | "center" | "right" | "start" | "end";
export type G7TextY = "top" | "center" | "bottom";

/**
 * Flex classes for an overlay container rendered with dir="ltr", so left/right are PHYSICAL sides
 * of the photo (the photos aren't mirrored for English). The text block inside sets its own dir.
 * Literal class strings per breakpoint (Tailwind only generates classes it can find in source).
 */
const OVERLAY = {
  base: {
    x: { left: "justify-start", center: "justify-center text-center", right: "justify-end" },
    y: { top: "items-start", center: "items-center", bottom: "items-end" },
  },
  md: {
    x: { left: "md:justify-start", center: "md:justify-center md:text-center", right: "md:justify-end" },
    y: { top: "md:items-start", center: "md:items-center", bottom: "md:items-end" },
  },
  xl: {
    x: { left: "xl:justify-start", center: "xl:justify-center xl:text-center", right: "xl:justify-end" },
    y: { top: "xl:items-start", center: "xl:items-center", bottom: "xl:items-end" },
  },
} as const;

/** "start"/"end" resolve per language to a physical side (the overlay itself is dir="ltr"). */
export function g7PhysicalX(x: G7TextX, locale: string): "left" | "center" | "right" {
  if (x === "start") return locale === "ar" ? "right" : "left";
  if (x === "end") return locale === "ar" ? "left" : "right";
  return x;
}

export function g7OverlayClasses(x: G7TextX, y: G7TextY, from: keyof typeof OVERLAY = "base", locale = "ar"): string {
  return `${OVERLAY[from].x[g7PhysicalX(x, locale)]} ${OVERLAY[from].y[y]}`;
}

/** Nudge in vw (fine-tuning on top of the preset) as CSS variables; pair with the g7-nudge* classes
 * (globals.css) so it only applies where the text actually sits on the photo. */
export function g7OffsetStyle(offsetX = 0, offsetY = 0): React.CSSProperties {
  return { "--g7-nx": `${offsetX}vw`, "--g7-ny": `${offsetY}vw` } as React.CSSProperties;
}

export function G7PositionFields({
  label = "Text position on photo",
  x,
  y,
  offsetX,
  offsetY,
  onChange,
  note,
}: {
  label?: string;
  x: G7TextX;
  y: G7TextY;
  offsetX: number;
  offsetY: number;
  onChange: (next: { x: G7TextX; y: G7TextY; offsetX: number; offsetY: number }) => void;
  note?: string;
}) {
  const set = (patch: Partial<{ x: G7TextX; y: G7TextY; offsetX: number; offsetY: number }>) => onChange({ x, y, offsetX, offsetY, ...patch });
  const btn = (active: boolean) => cn("flex-1 rounded px-2 py-1 text-xs", active ? "bg-neutral-200 text-neutral-900" : "text-neutral-300 hover:bg-neutral-800");
  return (
    <div className="space-y-2 rounded-md border border-neutral-700 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</p>
      <div className="flex gap-1 rounded-md bg-neutral-900 p-1">
        {(["left", "center", "right"] as const).map((v) => (
          <button key={v} type="button" className={btn(x === v)} onClick={() => set({ x: v })}>
            {v === "left" ? "شمال · Left" : v === "center" ? "وسط · Center" : "يمين · Right"}
          </button>
        ))}
      </div>
      <div className="flex gap-1 rounded-md bg-neutral-900 p-1" title="Follows the language: start = right in Arabic, left in English">
        {(["start", "end"] as const).map((v) => (
          <button key={v} type="button" className={btn(x === v)} onClick={() => set({ x: v })}>
            {v === "start" ? "بداية السطر · Start" : "نهاية السطر · End"}
          </button>
        ))}
      </div>
      <div className="flex gap-1 rounded-md bg-neutral-900 p-1">
        {(["top", "center", "bottom"] as const).map((v) => (
          <button key={v} type="button" className={btn(y === v)} onClick={() => set({ y: v })}>
            {v === "top" ? "Top" : v === "center" ? "Middle" : "Bottom"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-neutral-400">
          Nudge ← → ({offsetX})
          <input type="range" min={-20} max={20} step={0.5} value={offsetX} onChange={(e) => set({ offsetX: Number(e.target.value) })} className="w-full" />
        </label>
        <label className="text-xs text-neutral-400">
          Nudge ↑ ↓ ({offsetY})
          <input type="range" min={-20} max={20} step={0.5} value={offsetY} onChange={(e) => set({ offsetY: Number(e.target.value) })} className="w-full" />
        </label>
      </div>
      {note ? <p className="text-[11px] text-neutral-500">{note}</p> : null}
    </div>
  );
}
