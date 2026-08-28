"use client";

import { useActionState, useRef, useEffect } from "react";
import { createCertificationAction, type FormActionState } from "./actions";
import { MediaPickerField } from "@/components/admin/ui/media-picker-field";

const initialState: FormActionState = {};
const inputClass = "w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm";
const labelClass = "mb-1 block text-xs text-neutral-400";

export function CreateCertificationForm() {
  const [state, formAction, pending] = useActionState(createCertificationAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label className={labelClass}>Slug</label>
        <input name="slug" required placeholder="halal-certified" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Issuer (optional)</label>
        <input name="issuer" placeholder="Issuing body" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Name (English)</label>
        <input name="nameEn" required className={inputClass} />
      </div>
      <div dir="rtl">
        <label className={labelClass}>الاسم (عربي)</label>
        <input name="nameAr" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Valid from (optional)</label>
        <input type="date" name="validFrom" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Valid until (optional)</label>
        <input type="date" name="validUntil" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Order</label>
        <input name="order" type="number" defaultValue={0} className={inputClass} />
      </div>
      <MediaPickerField name="imageId" label="Certificate image (optional)" accept="IMAGE" />
      {state.error ? <p className="col-span-full text-sm text-red-400">{state.error}</p> : null}
      <div className="col-span-full">
        <button type="submit" disabled={pending} className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-60">
          {pending ? "Adding..." : "Add certification"}
        </button>
      </div>
    </form>
  );
}
