"use client";

import { Plus, Trash2 } from "lucide-react";
import { TextField } from "@/components/admin/ui/field";
import { MediaPickerControlled } from "@/components/admin/ui/media-picker-field";
import { IconButton } from "@/components/admin/ui/icon-button";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import { resolveColumnsClasses } from "../../style-tokens";
import type { GalleryData } from "../media-blocks";

export function GalleryEdit({ data, onChange, locale }: BlockEditProps<GalleryData>) {
  return (
    <div className="space-y-3">
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={locale === "ar" ? "rtl" : "ltr"} />
      <div className="space-y-2">
        {data.images.map((img, i) => (
          <div key={i} className="flex items-end gap-2 rounded-md border border-neutral-800 p-2">
            <MediaPickerControlled
              label={`Image ${i + 1}`}
              mediaId={img.id}
              previewUrl={img.url}
              onChange={(id, url) => {
                const next = [...data.images];
                if (id) next[i] = { id, url };
                onChange({ ...data, images: next });
              }}
            />
            <IconButton icon={Trash2} label="Remove" danger onClick={() => onChange({ ...data, images: data.images.filter((_, idx) => idx !== i) })} />
          </div>
        ))}
        {data.images.length < 12 ? (
          <button
            type="button"
            onClick={() => onChange({ ...data, images: [...data.images, { id: "", url: "" }] })}
            className="flex items-center gap-1.5 rounded-md border border-dashed border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
          >
            <Plus size={14} /> Add image
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function GalleryRender({ data, settings }: BlockRenderProps<GalleryData>) {
  const images = data.images.filter((img) => img.url);
  return (
    <div>
      {data.heading ? <h2 className="mb-6 font-display text-3xl">{data.heading}</h2> : null}
      <div className={`grid gap-4 ${resolveColumnsClasses(settings)}`}>
        {images.map((img) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={img.id} src={img.url} alt="" className="aspect-square w-full rounded-[var(--radius-md)] object-cover" />
        ))}
      </div>
    </div>
  );
}
