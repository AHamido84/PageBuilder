"use client";

import Link from "next/link";
import { TextField, SelectField, NumberField } from "@/components/admin/ui/field";
import { MediaPickerControlled } from "@/components/admin/ui/media-picker-field";
import { CmsImage, CmsFillImage } from "@/components/media/cms-image";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import { resolveHref } from "../../href";
import type { ImageData } from "../media-blocks";

const ASPECT_RATIO_CLASSES: Record<NonNullable<ImageData["aspectRatio"]>, string> = {
  auto: "aspect-[16/9]",
  "16/9": "aspect-[16/9]",
  "4/3": "aspect-[4/3]",
  "3/2": "aspect-[3/2]",
  "1/1": "aspect-[1/1]",
  "21/9": "aspect-[21/9]",
};

export function ImageEdit({ data, onChange, locale }: BlockEditProps<ImageData>) {
  return (
    <div className="space-y-3">
      <MediaPickerControlled
        label="Image (desktop)"
        mediaId={data.image?.id ?? ""}
        previewUrl={data.image?.url}
        onChange={(id, url) => onChange({ ...data, image: id ? { id, url } : null })}
      />
      <MediaPickerControlled
        label="Image (mobile, optional)"
        mediaId={data.mobileImage?.id ?? ""}
        previewUrl={data.mobileImage?.url}
        onChange={(id, url) => onChange({ ...data, mobileImage: id ? { id, url } : null })}
      />
      <TextField
        label={locale === "ar" ? "النص البديل" : "Alt text"}
        value={locale === "ar" ? data.altAr ?? "" : data.altEn ?? ""}
        onChange={(v) => onChange(locale === "ar" ? { ...data, altAr: v } : { ...data, altEn: v })}
        dir={locale === "ar" ? "rtl" : "ltr"}
      />
      <TextField label="Link URL (optional)" value={data.linkUrl ?? ""} onChange={(linkUrl) => onChange({ ...data, linkUrl })} />

      <div className="grid grid-cols-2 gap-2 border-t border-neutral-800 pt-3">
        <SelectField
          label="Aspect ratio"
          value={data.aspectRatio ?? "auto"}
          onChange={(aspectRatio) => onChange({ ...data, aspectRatio })}
          options={[
            { value: "auto", label: "Auto (original size)" },
            { value: "16/9", label: "16:9" },
            { value: "4/3", label: "4:3" },
            { value: "3/2", label: "3:2" },
            { value: "1/1", label: "1:1 square" },
            { value: "21/9", label: "21:9 wide" },
          ]}
        />
        <SelectField
          label="Fit"
          value={data.imageFit ?? "cover"}
          onChange={(imageFit) => onChange({ ...data, imageFit })}
          options={[
            { value: "cover", label: "Cover (fill, crop)" },
            { value: "contain", label: "Contain (fit within)" },
          ]}
        />
      </div>
      {(data.aspectRatio ?? "auto") !== "auto" ? (
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Focal X (%)" value={data.focalX ?? 50} min={0} max={100} onChange={(focalX) => onChange({ ...data, focalX })} />
          <NumberField label="Focal Y (%)" value={data.focalY ?? 50} min={0} max={100} onChange={(focalY) => onChange({ ...data, focalY })} />
        </div>
      ) : null}
      <NumberField label="Overlay opacity (%)" value={data.overlayOpacity ?? 0} min={0} max={100} onChange={(overlayOpacity) => onChange({ ...data, overlayOpacity })} />
    </div>
  );
}

export function ImageRender({ data, locale }: BlockRenderProps<ImageData>) {
  if (!data.image) return null;
  const alt = locale === "ar" ? data.altAr : data.altEn;
  const aspectRatio = data.aspectRatio ?? "auto";
  const hasMobileImage = Boolean(data.mobileImage);
  const overlayOpacity = data.overlayOpacity ?? 0;

  // Original, unmodified behavior: a plain intrinsic-size <img>, no fixed box, no fit/focal/overlay.
  // Every IMAGE section published before Phase 7's Image Control fields existed renders through
  // this exact path (aspectRatio defaults to "auto", mobileImage/overlayOpacity default to
  // null/0) -- zero visual change for existing content anywhere on the site.
  const usesPlainRender = aspectRatio === "auto" && !hasMobileImage && overlayOpacity === 0;

  let img: React.ReactNode;
  if (usesPlainRender) {
    img = (
      <CmsImage
        src={data.image.url}
        alt={alt ?? ""}
        className="w-full rounded-[var(--image-radius)] object-cover"
        context={{ mediaId: data.image.id, component: "IMAGE", locale }}
      />
    );
  } else {
    const fitClass = data.imageFit === "contain" ? "object-contain" : "object-cover";
    const positionStyle = { objectPosition: `${data.focalX ?? 50}% ${data.focalY ?? 50}%` };
    img = (
      <div className={`relative w-full overflow-hidden rounded-[var(--image-radius)] ${ASPECT_RATIO_CLASSES[aspectRatio]}`}>
        <div className={hasMobileImage ? "absolute inset-0 hidden md:block" : "absolute inset-0"}>
          <CmsFillImage
            src={data.image.url}
            alt={alt ?? ""}
            sizes="100vw"
            className={fitClass}
            style={positionStyle}
            context={{ mediaId: data.image.id, component: "IMAGE", locale }}
          />
        </div>
        {hasMobileImage ? (
          <div className="absolute inset-0 md:hidden">
            <CmsFillImage
              src={data.mobileImage!.url}
              alt={alt ?? ""}
              sizes="100vw"
              className={fitClass}
              style={positionStyle}
              context={{ mediaId: data.mobileImage!.id, component: "IMAGE", locale }}
            />
          </div>
        ) : null}
        {overlayOpacity > 0 ? <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: `rgba(10,24,38,${overlayOpacity / 100})` }} /> : null}
      </div>
    );
  }

  if (data.linkUrl) {
    return (
      <Link href={resolveHref(data.linkUrl, locale)} className="block">
        {img}
      </Link>
    );
  }
  return img;
}
