"use client";

import { useActionState } from "react";
import { updateCertificationAction, type FormActionState } from "../actions";
import { MediaPickerField } from "@/components/admin/ui/media-picker-field";

const initialState: FormActionState = {};
const inputClass = "w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm";
const labelClass = "mb-1 block text-xs text-neutral-400";

interface Props {
  certification: {
    id: string;
    slug: string;
    nameEn: string;
    nameAr: string;
    issuer: string | null;
    validFrom: Date | null;
    validUntil: Date | null;
    isPublished: boolean;
    imageId: string | null;
    image: { url: string } | null;
    order: number;
  };
}

function toDateInputValue(d: Date | null): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export function EditCertificationForm({ certification }: Props) {
  const [state, formAction, pending] = useActionState(updateCertificationAction, initialState);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={certification.id} />
      <div>
        <label className={labelClass}>Slug</label>
        <input name="slug" defaultValue={certification.slug} required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Issuer</label>
        <input name="issuer" defaultValue={certification.issuer ?? ""} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Name (English)</label>
        <input name="nameEn" defaultValue={certification.nameEn} required className={inputClass} />
      </div>
      <div dir="rtl">
        <label className={labelClass}>الاسم (عربي)</label>
        <input name="nameAr" defaultValue={certification.nameAr} required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Valid from</label>
        <input type="date" name="validFrom" defaultValue={toDateInputValue(certification.validFrom)} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Valid until</label>
        <input type="date" name="validUntil" defaultValue={toDateInputValue(certification.validUntil)} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Order</label>
        <input name="order" type="number" defaultValue={certification.order} className={inputClass} />
      </div>
      <MediaPickerField name="imageId" label="Certificate image" accept="IMAGE" defaultMediaId={certification.imageId} defaultUrl={certification.image?.url} />
      <label className="col-span-full flex items-center gap-2 text-sm text-neutral-300">
        <input type="checkbox" name="isPublished" value="true" defaultChecked={certification.isPublished} />
        Published
      </label>
      {state.error ? <p className="col-span-full text-sm text-red-400">{state.error}</p> : null}
      {state.success ? <p className="col-span-full text-sm text-emerald-400">Saved.</p> : null}
      <div className="col-span-full">
        <button type="submit" disabled={pending} className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-60">
          {pending ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
