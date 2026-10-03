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
export const g7H2 = "g7-h2";
export const g7Eyebrow = "g7-t24 font-normal text-[var(--g7-gold-500)]";
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
