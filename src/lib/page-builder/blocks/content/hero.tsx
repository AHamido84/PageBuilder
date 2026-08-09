"use client";

import Link from "next/link";
import { TextField, TextareaField } from "@/components/admin/ui/field";
import { MediaPickerControlled } from "@/components/admin/ui/media-picker-field";
import { buttonClasses } from "@/components/ui/button";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import { resolveHref } from "../../href";
import type { HeroData } from "../content-blocks";

export function HeroEdit({ data, onChange, locale }: BlockEditProps<HeroData & { imageUrl?: string }>) {
  return (
    <div className="space-y-3">
      <TextField label="Headline" value={data.headline} onChange={(headline) => onChange({ ...data, headline })} dir={locale === "ar" ? "rtl" : "ltr"} />
      <TextareaField label="Subheading" value={data.subheading ?? ""} onChange={(subheading) => onChange({ ...data, subheading })} dir={locale === "ar" ? "rtl" : "ltr"} rows={2} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Button label" value={data.ctaLabel ?? ""} onChange={(ctaLabel) => onChange({ ...data, ctaLabel })} />
        <TextField label="Button URL" value={data.ctaUrl ?? ""} onChange={(ctaUrl) => onChange({ ...data, ctaUrl })} />
      </div>
      <MediaPickerControlled
        label="Background image"
        mediaId={data.imageId ?? ""}
        previewUrl={data.imageUrl}
        onChange={(imageId, imageUrl) => onChange({ ...data, imageId, imageUrl })}
      />
    </div>
  );
}

export function HeroRender({ data, locale }: BlockRenderProps<HeroData & { imageUrl?: string }>) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {data.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.imageUrl} alt="" className="mb-6 h-48 w-full rounded-[var(--radius-md)] object-cover" />
      ) : null}
      <h1 className="font-display text-4xl sm:text-5xl">{data.headline}</h1>
      {data.subheading ? <p className="mt-4 opacity-70">{data.subheading}</p> : null}
      {data.ctaLabel && data.ctaUrl ? (
        <Link href={resolveHref(data.ctaUrl, locale)} className={`${buttonClasses("primary", "lg")} mt-8 inline-flex`}>
          {data.ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
