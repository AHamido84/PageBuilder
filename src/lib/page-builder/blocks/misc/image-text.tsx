"use client";

import Link from "next/link";
import { SegmentedControl } from "@/components/admin/ui/segmented-control";
import { TextField, TextareaField } from "@/components/admin/ui/field";
import { MediaPickerControlled } from "@/components/admin/ui/media-picker-field";
import { CmsImage } from "@/components/media/cms-image";
import { buttonClasses } from "@/components/ui/button";
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
      {data.heading ? <h2 className="font-display text-2xl">{data.heading}</h2> : null}
      {data.body ? <p className="mt-3 whitespace-pre-line opacity-70">{data.body}</p> : null}
      {data.ctaLabel && data.ctaUrl ? (
        <Link href={resolveHref(data.ctaUrl, locale)} className={`${buttonClasses("secondary", "md")} mt-6 inline-flex`}>
          {data.ctaLabel}
        </Link>
      ) : null}
    </div>
  );

  // No image set yet (e.g. a freshly-added section awaiting a real photo from
  // the admin) -- render text-only rather than leaving an empty box in the grid.
  if (!data.image?.url) return <div className="mx-auto max-w-2xl">{textColumn}</div>;

  return (
    <div className={`grid items-center gap-10 sm:grid-cols-2 ${imageFirst ? "" : "sm:[direction:rtl]"}`}>
      <div className={imageFirst ? "" : "sm:[direction:ltr]"}>
        <CmsImage
          src={data.image.url}
          alt=""
          className="aspect-[4/3] w-full rounded-[var(--radius-md)] object-cover"
          context={{ mediaId: data.image.id, component: "IMAGE_TEXT", locale }}
        />
      </div>
      {textColumn}
    </div>
  );
}
