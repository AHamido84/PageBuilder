"use client";

import { useActionState } from "react";
import { updateBrandAction, type FormActionState } from "../actions";
import { MediaPickerField } from "@/components/admin/ui/media-picker-field";

const initialState: FormActionState = {};

interface Props {
  brand: {
    id: string;
    slug: string;
    website: string | null;
    isActive: boolean;
    logoId: string | null;
    logo: { url: string } | null;
    bannerId: string | null;
    banner: { url: string } | null;
    translations: { locale: "EN" | "AR"; name: string; description: string | null }[];
  };
}

export function EditBrandForm({ brand }: Props) {
  const [state, formAction, pending] = useActionState(updateBrandAction, initialState);
  const en = brand.translations.find((t) => t.locale === "EN");
  const ar = brand.translations.find((t) => t.locale === "AR");

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={brand.id} />
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Slug</label>
        <input name="slug" defaultValue={brand.slug} required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Website</label>
        <input name="website" defaultValue={brand.website ?? ""} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Name (English)</label>
        <input name="nameEn" defaultValue={en?.name} required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div dir="rtl">
        <label className="mb-1 block text-xs text-neutral-400">الاسم (عربي)</label>
        <input name="nameAr" defaultValue={ar?.name} required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Description (English)</label>
        <textarea name="descriptionEn" defaultValue={en?.description ?? ""} rows={2} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div dir="rtl">
        <label className="mb-1 block text-xs text-neutral-400">الوصف (عربي)</label>
        <textarea name="descriptionAr" defaultValue={ar?.description ?? ""} rows={2} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <MediaPickerField name="logoId" label="Logo" accept="IMAGE" defaultMediaId={brand.logoId} defaultUrl={brand.logo?.url} />
      <MediaPickerField name="bannerId" label="Banner" accept="IMAGE" defaultMediaId={brand.bannerId} defaultUrl={brand.banner?.url} />
      <label className="col-span-full flex items-center gap-2 text-sm text-neutral-300">
        <input type="checkbox" name="isActive" value="true" defaultChecked={brand.isActive} />
        Active
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
