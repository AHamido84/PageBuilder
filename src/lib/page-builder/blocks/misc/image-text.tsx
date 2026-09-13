"use client";

import Link from "next/link";
import { SegmentedControl } from "@/components/admin/ui/segmented-control";
import { TextField, TextareaField } from "@/components/admin/ui/field";
import { MediaPickerControlled } from "@/components/admin/ui/media-picker-field";
import { CmsFillImage } from "@/components/media/cms-image";
import { OrganicFrame } from "@/components/ui/organic-frame";
import { buttonClasses } from "@/components/ui/button";
import { ScrollReveal } from "@/lib/motion/primitives";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import { resolveHref } from "../../href";
import type { ImageTextData } from "../misc-blocks";

export function ImageTextEdit({ data, onChange, locale }: BlockEditProps<ImageTextData>) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <div className="space-y-3">
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={dir} />
      <TextareaField label="Body" value={data.body ?? ""} onChange={(body) => onChange({ ...data, body })} dir={dir} rows={3} />
      <MediaPickerControlled label="Image" mediaId={data.image?.id ?? ""} previewUrl={data.image?.url} onChange={(id, url) => onChange({ ...data, image: id ? { id, url } : null })} />
      <SegmentedControl
        value={data.imagePosition}
        onChange={(imagePosition) => onChange({ ...data, imagePosition })}
        options={[
          { value: "left", label: "Image left" },
          { value: "right", label: "Image right" },
        ]}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Button label" value={data.ctaLabel ?? ""} onChange={(ctaLabel) => onChange({ ...data, ctaLabel })} dir={dir} />
        <TextField label="Button URL" value={data.ctaUrl ?? ""} onChange={(ctaUrl) => onChange({ ...data, ctaUrl })} />
      </div>
    </div>
  );
}

export function ImageTextRender({ data, locale }: BlockRenderProps<ImageTextData>) {
  const imageFirst = data.imagePosition !== "right";
  const textColumn = (
    <div className="sm:[direction:ltr]">
      {data.heading ? <h2 className="font-display text-h1 leading-[1.05]">{data.heading}</h2> : null}
      {data.body ? <p className="mt-5 max-w-lg whitespace-pre-line text-lg leading-relaxed opacity-70">{data.body}</p> : null}
      {data.ctaLabel && data.ctaUrl ? (
        <Link href={resolveHref(data.ctaUrl, locale)} className={`${buttonClasses("secondary", "lg")} mt-8 inline-flex`}>
          {data.ctaLabel}
        </Link>
      ) : null}
    </div>
  );

  // No image set yet (e.g. a freshly-added section awaiting a real photo from
  // the admin) -- render as a large centered editorial statement rather than a text-image split
  // waiting for its missing half.
  if (!data.image?.url) return <div className="mx-auto max-w-3xl text-center">{textColumn}</div>;

  return (
    <div className={`grid items-center gap-10 lg:gap-16 sm:grid-cols-2 ${imageFirst ? "" : "sm:[direction:rtl]"}`}>
      <ScrollReveal variant="fade-up" className={imageFirst ? "" : "sm:[direction:ltr]"}>
        <div className="relative aspect-[4/5] w-full">
          <OrganicFrame frameStyle="rounded-rectangle" className="absolute inset-0">
            <CmsFillImage
              src={data.image.url}
              alt=""
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover"
              context={{ mediaId: data.image.id, component: "IMAGE_TEXT", locale }}
            />
          </OrganicFrame>
        </div>
      </ScrollReveal>
      {textColumn}
    </div>
  );
}
