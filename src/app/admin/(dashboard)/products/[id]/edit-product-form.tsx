"use client";

import { updateProductDetailsAction, updateProductSpecsAction, type FormActionState } from "../actions";
import { useFormAction } from "@/lib/use-form-action";
import { StyledFormField } from "@/components/admin/text/styled-text-field";
import { richMapOf } from "@/lib/text-style/rich-text";

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
    /** Text styling map (src/lib/text-style). */
    rich?: unknown;
  }[];
}

export function EditProductForm({ product, categories, brands }: { product: ProductDetails; categories: { id: string; label: string }[]; brands: { id: string; slug: string }[] }) {
  const [state, formAction, pending, submitKeepingInput] = useFormAction(updateProductDetailsAction, initialState);
  const en = product.translations.find((t) => t.locale === "EN");
  const ar = product.translations.find((t) => t.locale === "AR");

  return (
    <form action={formAction} onSubmit={submitKeepingInput} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        <StyledFormField name="nameEn" defaultValue={en?.name} defaultRich={richMapOf(en?.rich, "name")} dir="ltr" />
      </div>
      <div dir="rtl">
        <label className={labelClass}>الاسم (عربي)</label>
        <StyledFormField name="nameAr" defaultValue={ar?.name} defaultRich={richMapOf(ar?.rich, "name")} dir="rtl" />
      </div>
      <div>
        <label className={labelClass}>Short description (English)</label>
        <StyledFormField name="shortDescriptionEn" defaultValue={en?.shortDescription} defaultRich={richMapOf(en?.rich, "shortDescription")} dir="ltr" placeholder="One line, shown on product cards" />
      </div>
      <div dir="rtl">
        <label className={labelClass}>وصف قصير (عربي)</label>
        <StyledFormField name="shortDescriptionAr" defaultValue={ar?.shortDescription} defaultRich={richMapOf(ar?.rich, "shortDescription")} dir="rtl" />
      </div>
      <div>
        <label className={labelClass}>Description (English)</label>
        <StyledFormField name="descriptionEn" defaultValue={en?.description} defaultRich={richMapOf(en?.rich, "description")} multiline dir="ltr" />
      </div>
      <div dir="rtl">
        <label className={labelClass}>الوصف (عربي)</label>
        <StyledFormField name="descriptionAr" defaultValue={ar?.description} defaultRich={richMapOf(ar?.rich, "description")} multiline dir="rtl" />
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
    rich?: unknown;
  }[];
}

export function ProductSpecsForm({ product }: { product: ProductSpecs }) {
  const [state, formAction, pending, submitKeepingInput] = useFormAction(updateProductSpecsAction, initialState);
  const en = product.translations.find((t) => t.locale === "EN");
  const ar = product.translations.find((t) => t.locale === "AR");

  return (
    <form action={formAction} onSubmit={submitKeepingInput} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        <StyledFormField name="packagingEn" defaultValue={en?.packagingInfo} defaultRich={richMapOf(en?.rich, "packagingInfo")} multiline dir="ltr" />
      </div>
      <div dir="rtl">
        <label className={labelClass}>التعبئة (عربي)</label>
        <StyledFormField name="packagingAr" defaultValue={ar?.packagingInfo} defaultRich={richMapOf(ar?.rich, "packagingInfo")} multiline dir="rtl" />
      </div>
      <div>
        <label className={labelClass}>Storage (English)</label>
        <StyledFormField name="storageEn" defaultValue={en?.storageInfo} defaultRich={richMapOf(en?.rich, "storageInfo")} multiline dir="ltr" />
      </div>
      <div dir="rtl">
        <label className={labelClass}>التخزين (عربي)</label>
        <StyledFormField name="storageAr" defaultValue={ar?.storageInfo} defaultRich={richMapOf(ar?.rich, "storageInfo")} multiline dir="rtl" />
      </div>
      <div>
        <label className={labelClass}>Ingredients (English)</label>
        <StyledFormField name="ingredientsEn" defaultValue={en?.ingredients} defaultRich={richMapOf(en?.rich, "ingredients")} multiline dir="ltr" />
      </div>
      <div dir="rtl">
        <label className={labelClass}>المكونات (عربي)</label>
        <StyledFormField name="ingredientsAr" defaultValue={ar?.ingredients} defaultRich={richMapOf(ar?.rich, "ingredients")} multiline dir="rtl" />
      </div>
      <div>
        <label className={labelClass}>Nutrition information (English)</label>
        <StyledFormField name="nutritionInfoEn" defaultValue={en?.nutritionInfo} defaultRich={richMapOf(en?.rich, "nutritionInfo")} multiline dir="ltr" />
      </div>
      <div dir="rtl">
        <label className={labelClass}>المعلومات الغذائية (عربي)</label>
        <StyledFormField name="nutritionInfoAr" defaultValue={ar?.nutritionInfo} defaultRich={richMapOf(ar?.rich, "nutritionInfo")} multiline dir="rtl" />
      </div>
      <div>
        <label className={labelClass}>Allergens (English)</label>
        <StyledFormField name="allergensEn" defaultValue={en?.allergens} defaultRich={richMapOf(en?.rich, "allergens")} multiline dir="ltr" />
      </div>
      <div dir="rtl">
        <label className={labelClass}>مسببات الحساسية (عربي)</label>
        <StyledFormField name="allergensAr" defaultValue={ar?.allergens} defaultRich={richMapOf(ar?.rich, "allergens")} multiline dir="rtl" />
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
