"use client";

import { useActionState } from "react";
import { updateProductAction, type FormActionState } from "../actions";

const initialState: FormActionState = {};

interface Props {
  product: {
    id: string;
    sku: string;
    slug: string;
    categoryId: string;
    brandId: string | null;
    temperatureClass: "FROZEN" | "CHILLED" | "AMBIENT";
    isPublished: boolean;
    originCountry: string | null;
    translations: {
      locale: "EN" | "AR";
      name: string;
      description: string | null;
      packagingInfo: string | null;
      storageInfo: string | null;
    }[];
  };
  categories: { id: string; slug: string }[];
  brands: { id: string; slug: string }[];
}

export function EditProductForm({ product, categories, brands }: Props) {
  const [state, formAction, pending] = useActionState(updateProductAction, initialState);
  const en = product.translations.find((t) => t.locale === "EN");
  const ar = product.translations.find((t) => t.locale === "AR");

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={product.id} />
      <div>
        <label className="mb-1 block text-xs text-neutral-400">SKU</label>
        <input name="sku" defaultValue={product.sku} required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Slug</label>
        <input name="slug" defaultValue={product.slug} required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Category</label>
        <select name="categoryId" defaultValue={product.categoryId} required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm">
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.slug}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Brand (optional)</label>
        <select name="brandId" defaultValue={product.brandId ?? ""} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm">
          <option value="">None</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.slug}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Temperature class</label>
        <select name="temperatureClass" defaultValue={product.temperatureClass} required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm">
          <option value="FROZEN">Frozen</option>
          <option value="CHILLED">Chilled</option>
          <option value="AMBIENT">Ambient</option>
        </select>
      </div>
      <label className="flex items-end gap-2 pb-1.5 text-sm text-neutral-300">
        <input type="checkbox" name="isPublished" value="true" defaultChecked={product.isPublished} />
        Published
      </label>
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
        <textarea name="descriptionEn" defaultValue={en?.description ?? ""} rows={3} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div dir="rtl">
        <label className="mb-1 block text-xs text-neutral-400">الوصف (عربي)</label>
        <textarea name="descriptionAr" defaultValue={ar?.description ?? ""} rows={3} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Country of origin</label>
        <input name="originCountry" defaultValue={product.originCountry ?? ""} placeholder="e.g. Brazil" className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div />
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Packaging (English)</label>
        <textarea name="packagingEn" defaultValue={en?.packagingInfo ?? ""} rows={2} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div dir="rtl">
        <label className="mb-1 block text-xs text-neutral-400">التعبئة (عربي)</label>
        <textarea name="packagingAr" defaultValue={ar?.packagingInfo ?? ""} rows={2} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Storage (English)</label>
        <textarea name="storageEn" defaultValue={en?.storageInfo ?? ""} rows={2} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div dir="rtl">
        <label className="mb-1 block text-xs text-neutral-400">التخزين (عربي)</label>
        <textarea name="storageAr" defaultValue={ar?.storageInfo ?? ""} rows={2} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
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
