"use client";

import { Plus, Quote, Trash2 } from "lucide-react";
import { TextField, TextareaField } from "@/components/admin/ui/field";
import { IconButton } from "@/components/admin/ui/icon-button";
import { MediaPickerControlled } from "@/components/admin/ui/media-picker-field";
import { CmsFillImage } from "@/components/media/cms-image";
import { ScrollReveal } from "@/lib/motion/primitives";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import type { TestimonialsData } from "../social-proof-blocks";

export function TestimonialsEdit({ data, onChange, locale }: BlockEditProps<TestimonialsData>) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const items = data.items;
  function setItems(next: TestimonialsData["items"]) {
    onChange({ ...data, items: next });
  }
  return (
    <div className="space-y-3">
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={dir} />
      {items.map((item, i) => (
        <div key={i} className="space-y-2 rounded-md border border-neutral-800 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-neutral-500">Testimonial {i + 1}</p>
            <IconButton icon={Trash2} label="Remove" danger onClick={() => setItems(items.filter((_, idx) => idx !== i))} />
          </div>
          <TextareaField label="Quote" value={item.quote} onChange={(quote) => setItems(items.map((it, idx) => (idx === i ? { ...it, quote } : it)))} dir={dir} rows={2} />
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Author name" value={item.authorName} onChange={(authorName) => setItems(items.map((it, idx) => (idx === i ? { ...it, authorName } : it)))} dir={dir} />
            <TextField label="Author role" value={item.authorRole ?? ""} onChange={(authorRole) => setItems(items.map((it, idx) => (idx === i ? { ...it, authorRole } : it)))} dir={dir} />
          </div>
          <MediaPickerControlled
            label="Photo (optional)"
            mediaId={item.avatar?.id ?? ""}
            previewUrl={item.avatar?.url}
            onChange={(id, url) => setItems(items.map((it, idx) => (idx === i ? { ...it, avatar: id ? { id, url } : null } : it)))}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => setItems([...items, { quote: "", authorName: "", authorRole: "", avatar: null }])}
        className="flex items-center gap-1.5 rounded-md border border-dashed border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
      >
        <Plus size={14} /> Add testimonial
      </button>
    </div>
  );
}

function Avatar({ avatar, name, locale, size }: { avatar: { id: string; url: string } | null; name: string; locale: string; size: "lg" | "sm" }) {
  const dimension = size === "lg" ? "h-16 w-16" : "h-11 w-11";
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span className={`relative shrink-0 overflow-hidden rounded-full bg-harbor-soft ${dimension}`}>
      {avatar?.url ? (
        <CmsFillImage src={avatar.url} alt={name} sizes="64px" className="object-cover" context={{ mediaId: avatar.id, component: "TESTIMONIALS", locale }} />
      ) : (
        <span className={`flex h-full w-full items-center justify-center font-display text-harbor ${size === "lg" ? "text-xl" : "text-sm"}`}>{initial}</span>
      )}
    </span>
  );
}

/**
 * Phase 3 premium redesign: an asymmetric editorial layout -- one large featured quote (oversized
 * quotation mark, photo, larger type) alongside smaller supporting quotes, replacing the previous
 * uniform N-column card grid. Falls back gracefully with just one item (no "supporting" row).
 */
export function TestimonialsRender({ data, locale }: BlockRenderProps<TestimonialsData>) {
  const [featured, ...rest] = data.items;
  if (!featured) return null;

  return (
    <div>
      {data.heading ? <h2 className="mb-10 font-display text-h2">{data.heading}</h2> : null}
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
        <ScrollReveal variant="fade-up" className="relative rounded-[var(--radius-xl)] border border-current/10 bg-paper p-8 sm:p-12">
          <Quote className="mb-4 h-10 w-10 text-wheat/70" strokeWidth={1.5} aria-hidden />
          <blockquote className="font-display text-h3 leading-snug text-ink">&ldquo;{featured.quote}&rdquo;</blockquote>
          <figcaption className="mt-6 flex items-center gap-4">
            <Avatar avatar={featured.avatar ?? null} name={featured.authorName} locale={locale} size="lg" />
            <span>
              <span className="block font-medium">{featured.authorName}</span>
              {featured.authorRole ? <span className="block text-sm opacity-55">{featured.authorRole}</span> : null}
            </span>
          </figcaption>
        </ScrollReveal>

        {rest.length > 0 ? (
          <div className="flex flex-col gap-[var(--card-gap,1.5rem)]">
            {rest.map((item, i) => (
              <ScrollReveal key={i} variant="fade-up" className="rounded-[var(--radius-lg)] border border-current/10 p-6">
                <blockquote className="text-sm leading-relaxed opacity-80">&ldquo;{item.quote}&rdquo;</blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <Avatar avatar={item.avatar ?? null} name={item.authorName} locale={locale} size="sm" />
                  <span className="text-sm font-medium">
                    {item.authorName}
                    {item.authorRole ? <span className="opacity-50"> — {item.authorRole}</span> : null}
                  </span>
                </figcaption>
              </ScrollReveal>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
