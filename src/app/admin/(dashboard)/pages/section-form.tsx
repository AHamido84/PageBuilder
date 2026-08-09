"use client";

import { useActionState, useState } from "react";
import { createSectionAction, updateSectionAction, type FormActionState } from "./section-actions";
import { BLOCK_TYPES, type BlockType } from "./block-types";
import { MediaPickerField } from "@/components/admin/ui/media-picker-field";

const initialState: FormActionState = {};

const inputClass = "w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm";

interface SectionData {
  [key: string]: unknown;
}

interface SectionFormProps {
  mode: "create" | "edit";
  pageId: string;
  sectionId?: string;
  categories: { id: string; label: string }[];
  defaultType?: BlockType;
  defaultDataEn?: SectionData;
  defaultDataAr?: SectionData;
  defaultVisible?: boolean;
  onDone: () => void;
}

export function SectionForm({
  mode,
  pageId,
  sectionId,
  categories,
  defaultType = "TEXT",
  defaultDataEn = {},
  defaultDataAr = {},
  defaultVisible = true,
  onDone,
}: SectionFormProps) {
  const action = mode === "create" ? createSectionAction : updateSectionAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [type, setType] = useState<BlockType>(defaultType);

  if (state.success && !pending) onDone();

  const items = (defaultDataEn.items as { title: string; body: string }[] | undefined) ?? [];
  const itemsAr = (defaultDataAr.items as { title: string; body: string }[] | undefined) ?? [];

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="pageId" value={pageId} />
      {sectionId ? <input type="hidden" name="sectionId" value={sectionId} /> : null}

      <div>
        <label className="mb-1 block text-xs text-neutral-400">Block type</label>
        <select name="type" value={type} onChange={(e) => setType(e.target.value as BlockType)} disabled={mode === "edit"} className={inputClass}>
          {BLOCK_TYPES.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
      </div>

      {type === "HERO" ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <input name="headlineEn" placeholder="Headline (EN)" defaultValue={defaultDataEn.headline as string} className={inputClass} />
            <input name="headlineAr" placeholder="العنوان (AR)" dir="rtl" defaultValue={defaultDataAr.headline as string} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input name="subheadingEn" placeholder="Subheading (EN)" defaultValue={defaultDataEn.subheading as string} className={inputClass} />
            <input name="subheadingAr" placeholder="العنوان الفرعي (AR)" dir="rtl" defaultValue={defaultDataAr.subheading as string} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input name="ctaLabelEn" placeholder="Button label (EN)" defaultValue={defaultDataEn.ctaLabel as string} className={inputClass} />
            <input name="ctaLabelAr" placeholder="نص الزر (AR)" dir="rtl" defaultValue={defaultDataAr.ctaLabel as string} className={inputClass} />
          </div>
          <input name="ctaUrl" placeholder="Button link (e.g. /en/contact)" defaultValue={defaultDataEn.ctaUrl as string} className={inputClass} />
          <MediaPickerField name="imageId" label="Background image" accept="IMAGE" defaultMediaId={defaultDataEn.imageId as string} />
        </>
      ) : null}

      {type === "TEXT" ? (
        <>
          <textarea name="bodyEn" placeholder="Body (EN)" rows={4} defaultValue={defaultDataEn.body as string} className={inputClass} />
          <textarea name="bodyAr" placeholder="النص (AR)" dir="rtl" rows={4} defaultValue={defaultDataAr.body as string} className={inputClass} />
        </>
      ) : null}

      {type === "MEDIA_TEXT" ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <input name="headingEn" placeholder="Heading (EN)" defaultValue={defaultDataEn.heading as string} className={inputClass} />
            <input name="headingAr" placeholder="العنوان (AR)" dir="rtl" defaultValue={defaultDataAr.heading as string} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <textarea name="bodyEn" placeholder="Body (EN)" rows={3} defaultValue={defaultDataEn.body as string} className={inputClass} />
            <textarea name="bodyAr" placeholder="النص (AR)" dir="rtl" rows={3} defaultValue={defaultDataAr.body as string} className={inputClass} />
          </div>
          <select name="imagePosition" defaultValue={(defaultDataEn.imagePosition as string) || "left"} className={inputClass}>
            <option value="left">Image on left</option>
            <option value="right">Image on right</option>
          </select>
          <MediaPickerField name="imageId" label="Image" accept="IMAGE" defaultMediaId={defaultDataEn.imageId as string} />
        </>
      ) : null}

      {type === "GALLERY" ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <input name="headingEn" placeholder="Heading (EN)" defaultValue={defaultDataEn.heading as string} className={inputClass} />
            <input name="headingAr" placeholder="العنوان (AR)" dir="rtl" defaultValue={defaultDataAr.heading as string} className={inputClass} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <MediaPickerField
                key={n}
                name={`galleryImage${n}`}
                label={`Image ${n}`}
                accept="IMAGE"
                defaultMediaId={(defaultDataEn.images as string[] | undefined)?.[n - 1]}
              />
            ))}
          </div>
        </>
      ) : null}

      {type === "PRODUCT_GRID" ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <input name="headingEn" placeholder="Heading (EN)" defaultValue={defaultDataEn.heading as string} className={inputClass} />
            <input name="headingAr" placeholder="العنوان (AR)" dir="rtl" defaultValue={defaultDataAr.heading as string} className={inputClass} />
          </div>
          <select name="categoryId" defaultValue={defaultDataEn.categoryId as string} className={inputClass}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <input name="limit" type="number" placeholder="Number of products" defaultValue={(defaultDataEn.limit as string) || "8"} className={inputClass} />
        </>
      ) : null}

      {type === "CONTACT_CTA" ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <input name="headingEn" placeholder="Heading (EN)" defaultValue={defaultDataEn.heading as string} className={inputClass} />
            <input name="headingAr" placeholder="العنوان (AR)" dir="rtl" defaultValue={defaultDataAr.heading as string} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <textarea name="bodyEn" placeholder="Body (EN)" rows={2} defaultValue={defaultDataEn.body as string} className={inputClass} />
            <textarea name="bodyAr" placeholder="النص (AR)" dir="rtl" rows={2} defaultValue={defaultDataAr.body as string} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input name="ctaLabelEn" placeholder="Button label (EN)" defaultValue={defaultDataEn.ctaLabel as string} className={inputClass} />
            <input name="ctaLabelAr" placeholder="نص الزر (AR)" dir="rtl" defaultValue={defaultDataAr.ctaLabel as string} className={inputClass} />
          </div>
        </>
      ) : null}

      {type === "VALUE_PROPS" ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <input name="headingEn" placeholder="Heading (EN)" defaultValue={defaultDataEn.heading as string} className={inputClass} />
            <input name="headingAr" placeholder="العنوان (AR)" dir="rtl" defaultValue={defaultDataAr.heading as string} className={inputClass} />
          </div>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="rounded-md border border-neutral-800 p-2">
              <p className="mb-1.5 text-xs text-neutral-500">Item {n}</p>
              <div className="mb-1.5 grid grid-cols-2 gap-2">
                <input name={`vpTitle${n}En`} placeholder="Title (EN)" defaultValue={items[n - 1]?.title} className={inputClass} />
                <input name={`vpTitle${n}Ar`} placeholder="العنوان (AR)" dir="rtl" defaultValue={itemsAr[n - 1]?.title} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <textarea name={`vpBody${n}En`} placeholder="Body (EN)" rows={2} defaultValue={items[n - 1]?.body} className={inputClass} />
                <textarea name={`vpBody${n}Ar`} placeholder="النص (AR)" dir="rtl" rows={2} defaultValue={itemsAr[n - 1]?.body} className={inputClass} />
              </div>
            </div>
          ))}
        </>
      ) : null}

      <label className="flex items-center gap-2 text-sm text-neutral-300">
        <input type="checkbox" name="isVisible" value="true" defaultChecked={defaultVisible} />
        Visible
      </label>

      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="w-full rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-60">
        {pending ? "Saving..." : mode === "create" ? "Add section" : "Save section"}
      </button>
    </form>
  );
}
