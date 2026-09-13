"use client";

import Link from "next/link";
import { TextField, TextareaField } from "@/components/admin/ui/field";
import { SegmentedControl } from "@/components/admin/ui/segmented-control";
import { MediaPickerControlled } from "@/components/admin/ui/media-picker-field";
import { CmsFillImage } from "@/components/media/cms-image";
import { buttonClasses } from "@/components/ui/button";
import { ScrollReveal } from "@/lib/motion/primitives";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import { resolveHref } from "../../href";
import type { CtaData } from "../content-blocks";

export function CtaEdit({ data, onChange, locale }: BlockEditProps<CtaData>) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <div className="space-y-3">
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={dir} />
      <TextareaField label="Body" value={data.body ?? ""} onChange={(body) => onChange({ ...data, body })} dir={dir} rows={2} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Button label" value={data.ctaLabel} onChange={(ctaLabel) => onChange({ ...data, ctaLabel })} dir={dir} />
        <TextField label="Button URL" value={data.ctaUrl} onChange={(ctaUrl) => onChange({ ...data, ctaUrl })} />
      </div>
      <SegmentedControl
        value={data.layout}
        onChange={(layout) => onChange({ ...data, layout })}
        options={[
          { value: "centered", label: "Centered (text only)" },
          { value: "banner", label: "Banner (full-bleed image)" },
        ]}
      />
      {data.layout === "banner" ? (
        <MediaPickerControlled label="Background image" mediaId={data.image?.id ?? ""} previewUrl={data.image?.url} onChange={(id, url) => onChange({ ...data, image: id ? { id, url } : null })} />
      ) : null}
    </div>
  );
}

export function CtaRender({ data, locale }: BlockRenderProps<CtaData>) {
  const hasBannerImage = data.layout === "banner" && Boolean(data.image?.url);

  if (!hasBannerImage) {
    return (
      <div className="mx-auto max-w-xl text-center">
        {data.heading ? <h2 className="font-display text-3xl">{data.heading}</h2> : null}
        {data.body ? <p className="mx-auto mt-4 opacity-65">{data.body}</p> : null}
        <Link href={resolveHref(data.ctaUrl, locale)} className={`${buttonClasses("primary", "lg")} mt-8 inline-flex`}>
          {data.ctaLabel}
        </Link>
      </div>
    );
  }

  return (
    <ScrollReveal variant="zoom-in" className="relative isolate flex min-h-[420px] items-center overflow-hidden rounded-[var(--radius-xl)] p-10 sm:min-h-[480px] sm:p-16">
      <CmsFillImage src={data.image!.url} alt="" sizes="100vw" className="object-cover" context={{ mediaId: data.image!.id, component: "CTA", locale }} />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/40 to-ink/10" />
      <div className="relative max-w-xl text-paper">
        {data.heading ? <h2 className="font-display text-h1 leading-tight">{data.heading}</h2> : null}
        {data.body ? <p className="mt-4 max-w-md text-paper/80">{data.body}</p> : null}
        <Link href={resolveHref(data.ctaUrl, locale)} className={`${buttonClasses("gold", "lg")} mt-8 inline-flex`}>
          {data.ctaLabel}
        </Link>
      </div>
    </ScrollReveal>
  );
}
