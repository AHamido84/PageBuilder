"use client";

import Link from "next/link";
import { TextField, TextareaField } from "@/components/admin/ui/field";
import { MediaPickerControlled } from "@/components/admin/ui/media-picker-field";
import { buttonClasses } from "@/components/ui/button";
import { FadeUp, Stagger, StaggerItem } from "@/lib/motion/primitives";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import { resolveHref } from "../../href";
import type { HeroData } from "../content-blocks";

export function HeroEdit({ data, onChange, locale }: BlockEditProps<HeroData & { imageUrl?: string }>) {
  return (
    <div className="space-y-3">
      <TextField label="Eyebrow" value={data.eyebrow ?? ""} onChange={(eyebrow) => onChange({ ...data, eyebrow })} dir={locale === "ar" ? "rtl" : "ltr"} />
      <TextField label="Headline" value={data.headline} onChange={(headline) => onChange({ ...data, headline })} dir={locale === "ar" ? "rtl" : "ltr"} />
      <TextareaField label="Subheading" value={data.subheading ?? ""} onChange={(subheading) => onChange({ ...data, subheading })} dir={locale === "ar" ? "rtl" : "ltr"} rows={2} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Primary button label" value={data.ctaLabel ?? ""} onChange={(ctaLabel) => onChange({ ...data, ctaLabel })} />
        <TextField label="Primary button URL" value={data.ctaUrl ?? ""} onChange={(ctaUrl) => onChange({ ...data, ctaUrl })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Secondary button label" value={data.ctaLabel2 ?? ""} onChange={(ctaLabel2) => onChange({ ...data, ctaLabel2 })} />
        <TextField label="Secondary button URL" value={data.ctaUrl2 ?? ""} onChange={(ctaUrl2) => onChange({ ...data, ctaUrl2 })} />
      </div>
      <MediaPickerControlled
        label="Visual (image)"
        mediaId={data.imageId ?? ""}
        previewUrl={data.imageUrl}
        onChange={(imageId, imageUrl) => onChange({ ...data, imageId, imageUrl })}
      />
    </div>
  );
}

export function HeroRender({ data, locale }: BlockRenderProps<HeroData & { imageUrl?: string }>) {
  const hasPrimaryCta = Boolean(data.ctaLabel && data.ctaUrl);
  const hasSecondaryCta = Boolean(data.ctaLabel2 && data.ctaUrl2);

  return (
    <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
      {/* Text column renders first in DOM so it lands on the reading-start side in both LTR and RTL —
          CSS Grid places track 1 at the inline-start edge, which is genuinely mirrored under dir="rtl",
          not a manual left/right swap. */}
      <Stagger>
        {data.eyebrow ? (
          <StaggerItem>
            <p className="manifest-strip mb-4 opacity-60">{data.eyebrow}</p>
          </StaggerItem>
        ) : null}
        <StaggerItem>
          <h1 className="font-display text-hero measure-ar">{data.headline}</h1>
        </StaggerItem>
        {data.subheading ? (
          <StaggerItem>
            <p className="measure-ar mt-5 max-w-lg text-base leading-relaxed opacity-70 sm:text-lg">{data.subheading}</p>
          </StaggerItem>
        ) : null}
        {hasPrimaryCta || hasSecondaryCta ? (
          <StaggerItem>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {hasPrimaryCta ? (
                <Link href={resolveHref(data.ctaUrl, locale)} className={buttonClasses("primary", "lg")}>
                  {data.ctaLabel}
                </Link>
              ) : null}
              {hasSecondaryCta ? (
                <Link href={resolveHref(data.ctaUrl2, locale)} className={buttonClasses("ghost-light", "lg")}>
                  {data.ctaLabel2}
                </Link>
              ) : null}
            </div>
          </StaggerItem>
        ) : null}
      </Stagger>

      {data.imageUrl ? (
        <FadeUp delay={0.35} y={16} className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] lg:aspect-[5/4]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.imageUrl} alt="" className="h-full w-full object-cover" />
        </FadeUp>
      ) : null}
    </div>
  );
}
