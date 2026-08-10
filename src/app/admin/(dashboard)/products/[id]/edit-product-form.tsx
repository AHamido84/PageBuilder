"use client";

import { useActionState } from "react";
import { updateProductDetailsAction, updateProductSpecsAction, type FormActionState } from "../actions";

const initialState: FormActionState = {};
const inputClass = "w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm";
const labelClass = "mb-1 block text-xs text-neutral-400";

interface ProductDetails {
  id: string;
  sku: string;
  slug: string;
  categoryId: string;
  brandId: string | null;
  temperatureClass: "FROZEN" | "CHILLED" | "AMBIENT";
  isPublished: boolean;
  isFeatured: boolean;
  originCountry: string | null;
  translations: {
    locale: "EN" | "AR";
    name: string;
    shortDescription: string | null;
    description: string | null;
  }[];
}

export function EditProductForm({ product, categories, brands }: { product: ProductDetails; categories: { id: string; label: string }[]; brands: { id: string; slug: string }[] }) {
  const [state, formAction, pending] = useActionState(updateProductDetailsAction, initialState);
  const en = product.translations.find((t) => t.locale === "EN");
  const ar = product.translations.find((t) => t.locale === "AR");

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={product.id} />
      <div>
        <label className={labelClass}>SKU</label>
        <input name="sku" defaultValue={product.sku} required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Slug</label>
        <input name="slug" defaultValue={product.slug} required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Category</label>
        <select name="categoryId" defaultValue={product.categoryId} required className={inputClass}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Brand (optional)</label>
        <select name="brandId" defaultValue={product.brandId ?? ""} className={inputClass}>
          <option value="">None</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.slug}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Temperature class</label>
        <select name="temperatureClass" defaultValue={product.temperatureClass} required className={inputClass}>
          <option value="FROZEN">Frozen</option>
          <option value="CHILLED">Chilled</option>
          <option value="AMBIENT">Ambient</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Country of origin</label>
        <input name="originCountry" defaultValue={product.originCountry ?? ""} placeholder="e.g. Brazil" className={inputClass} />
      </div>
      <div className="col-span-full flex items-end gap-4 pb-1.5">
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input type="checkbox" name="isPublished" value="true" defaultChecked={product.isPublished} />
          Published
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input type="checkbox" name="isFeatured" value="true" defaultChecked={product.isFeatured} />
          Featured
        </label>
      </div>
      <div>
        <label className={labelClass}>Name (English)</label>
        <input name="nameEn" defaultValue={en?.name} required className={inputClass} />
      </div>
      <div dir="rtl">
        <label className={labelClass}>الاسم (عربي)</label>
        <input name="nameAr" defaultValue={ar?.name} required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Short description (English)</label>
        <input name="shortDescriptionEn" defaultValue={en?.shortDescription ?? ""} placeholder="One line, shown on product cards" className={inputClass} />
      </div>
      <div dir="rtl">
        <label className={labelClass}>وصف قصير (عربي)</label>
        <input name="shortDescriptionAr" defaultValue={ar?.shortDescription ?? ""} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Description (English)</label>
        <textarea name="descriptionEn" defaultValue={en?.description ?? ""} rows={4} className={inputClass} />
      </div>
      <div dir="rtl">
        <label className={labelClass}>الوصف (عربي)</label>
        <textarea name="descriptionAr" defaultValue={ar?.description ?? ""} rows={4} className={inputClass} />
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

interface ProductSpecs {
  id: string;
  weight: string | null;
  dimensions: string | null;
  translations: {
    locale: "EN" | "AR";
    packagingInfo: string | null;
    storageInfo: string | null;
    ingredients: string | null;
    nutritionInfo: string | null;
    allergens: string | null;
  }[];
}

export function ProductSpecsForm({ product }: { product: ProductSpecs }) {
  const [state, formAction, pending] = useActionState(updateProductSpecsAction, initialState);
  const en = product.translations.find((t) => t.locale === "EN");
  const ar = product.translations.find((t) => t.locale === "AR");

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={product.id} />
      <div>
        <label className={labelClass}>Weight</label>
        <input name="weight" defaultValue={product.weight ?? ""} placeholder="e.g. 500 g" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Dimensions</label>
        <input name="dimensions" defaultValue={product.dimensions ?? ""} placeholder="e.g. 20 × 15 × 10 cm" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Packaging (English)</label>
        <textarea name="packagingEn" defaultValue={en?.packagingInfo ?? ""} rows={2} className={inputClass} />
      </div>
      <div dir="rtl">
        <label className={labelClass}>التعبئة (عربي)</label>
        <textarea name="packagingAr" defaultValue={ar?.packagingInfo ?? ""} rows={2} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Storage (English)</label>
        <textarea name="storageEn" defaultValue={en?.storageInfo ?? ""} rows={2} className={inputClass} />
      </div>
      <div dir="rtl">
        <label className={labelClass}>التخزين (عربي)</label>
        <textarea name="storageAr" defaultValue={ar?.storageInfo ?? ""} rows={2} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Ingredients (English)</label>
        <textarea name="ingredientsEn" defaultValue={en?.ingredients ?? ""} rows={2} className={inputClass} />
      </div>
      <div dir="rtl">
        <label className={labelClass}>المكونات (عربي)</label>
        <textarea name="ingredientsAr" defaultValue={ar?.ingredients ?? ""} rows={2} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Nutrition information (English)</label>
        <textarea name="nutritionInfoEn" defaultValue={en?.nutritionInfo ?? ""} rows={2} className={inputClass} />
      </div>
      <div dir="rtl">
        <label className={labelClass}>المعلومات الغذائية (عربي)</label>
        <textarea name="nutritionInfoAr" defaultValue={ar?.nutritionInfo ?? ""} rows={2} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Allergens (English)</label>
        <textarea name="allergensEn" defaultValue={en?.allergens ?? ""} rows={2} className={inputClass} />
      </div>
      <div dir="rtl">
        <label className={labelClass}>مسببات الحساسية (عربي)</label>
        <textarea name="allergensAr" defaultValue={ar?.allergens ?? ""} rows={2} className={inputClass} />
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
