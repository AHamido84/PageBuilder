"use client";

import { useActionState, useRef, useEffect } from "react";
import { createBrandAction, type FormActionState } from "./actions";
import { MediaPickerField } from "@/components/admin/ui/media-picker-field";

const initialState: FormActionState = {};

export function CreateBrandForm() {
  const [state, formAction, pending] = useActionState(createBrandAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Slug</label>
        <input name="slug" required placeholder="acme-foods" className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Website (optional)</label>
        <input name="website" placeholder="https://example.com" className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Name (English)</label>
        <input name="nameEn" required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div dir="rtl">
        <label className="mb-1 block text-xs text-neutral-400">الاسم (عربي)</label>
        <input name="nameAr" required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Description (English)</label>
        <textarea name="descriptionEn" rows={2} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div dir="rtl">
        <label className="mb-1 block text-xs text-neutral-400">الوصف (عربي)</label>
        <textarea name="descriptionAr" rows={2} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Order</label>
        <input name="order" type="number" defaultValue={0} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <MediaPickerField name="logoId" label="Logo" accept="IMAGE" />
      <MediaPickerField name="bannerId" label="Banner" accept="IMAGE" />
      <label className="col-span-full flex items-center gap-2 text-sm text-neutral-300">
        <input type="checkbox" name="isFeatured" value="true" />
        Featured brand — show in the dynamic Brand Grid section
      </label>
      {state.error ? <p className="col-span-full text-sm text-red-400">{state.error}</p> : null}
      <div className="col-span-full">
        <button type="submit" disabled={pending} className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-60">
          {pending ? "Adding..." : "Add brand"}
        </button>
      </div>
    </form>
  );
}
