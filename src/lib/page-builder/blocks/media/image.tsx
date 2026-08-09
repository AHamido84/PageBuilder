"use client";

import Link from "next/link";
import { TextField } from "@/components/admin/ui/field";
import { MediaPickerControlled } from "@/components/admin/ui/media-picker-field";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import { resolveHref } from "../../href";
import type { ImageData } from "../media-blocks";

export function ImageEdit({ data, onChange, locale }: BlockEditProps<ImageData>) {
  return (
    <div className="space-y-3">
      <MediaPickerControlled
        label="Image"
        mediaId={data.image?.id ?? ""}
        previewUrl={data.image?.url}
        onChange={(id, url) => onChange({ ...data, image: id ? { id, url } : null })}
      />
      <TextField
        label={locale === "ar" ? "النص البديل" : "Alt text"}
        value={locale === "ar" ? data.altAr ?? "" : data.altEn ?? ""}
        onChange={(v) => onChange(locale === "ar" ? { ...data, altAr: v } : { ...data, altEn: v })}
        dir={locale === "ar" ? "rtl" : "ltr"}
      />
      <TextField label="Link URL (optional)" value={data.linkUrl ?? ""} onChange={(linkUrl) => onChange({ ...data, linkUrl })} />
    </div>
  );
}

export function ImageRender({ data, locale }: BlockRenderProps<ImageData>) {
  if (!data.image) return null;
  const alt = locale === "ar" ? data.altAr : data.altEn;
  // eslint-disable-next-line @next/next/no-img-element
  const img = <img src={data.image.url} alt={alt ?? ""} className="w-full rounded-[var(--radius-md)] object-cover" />;
  if (data.linkUrl) {
    return (
      <Link href={resolveHref(data.linkUrl, locale)} className="block">
        {img}
      </Link>
    );
  }
  return img;
}
