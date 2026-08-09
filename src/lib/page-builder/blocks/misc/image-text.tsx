"use client";

import { SegmentedControl } from "@/components/admin/ui/segmented-control";
import { TextField, TextareaField } from "@/components/admin/ui/field";
import { MediaPickerControlled } from "@/components/admin/ui/media-picker-field";
import type { BlockEditProps, BlockRenderProps } from "../../types";
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
    </div>
  );
}

export function ImageTextRender({ data }: BlockRenderProps<ImageTextData>) {
  const imageFirst = data.imagePosition !== "right";
  return (
    <div className={`grid items-center gap-10 sm:grid-cols-2 ${imageFirst ? "" : "sm:[direction:rtl]"}`}>
      <div className={imageFirst ? "" : "sm:[direction:ltr]"}>
        {data.image?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.image.url} alt="" className="aspect-[4/3] w-full rounded-[var(--radius-md)] object-cover" />
        ) : null}
      </div>
      <div className="sm:[direction:ltr]">
        {data.heading ? <h2 className="font-display text-2xl">{data.heading}</h2> : null}
        {data.body ? <p className="mt-3 whitespace-pre-line opacity-70">{data.body}</p> : null}
      </div>
    </div>
  );
}
