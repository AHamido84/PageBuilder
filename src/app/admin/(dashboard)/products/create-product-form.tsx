"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createProductAction, type FormActionState } from "./actions";

const initialState: FormActionState = {};

interface Props {
  categories: { id: string; slug: string }[];
  brands: { id: string; slug: string }[];
}

export function CreateProductForm({ categories, brands }: Props) {
  const [state, formAction, pending] = useActionState(createProductAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success && state.id) {
      router.push(`/admin/products/${state.id}`);
    }
  }, [state.success, state.id, router]);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs text-neutral-400">SKU</label>
        <input name="sku" required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Slug</label>
        <input name="slug" required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Category</label>
        <select name="categoryId" required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm">
          <option value="">Select...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.slug}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Brand (optional)</label>
        <select name="brandId" defaultValue="" className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm">
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
        <select name="temperatureClass" required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm">
          <option value="FROZEN">Frozen</option>
          <option value="CHILLED">Chilled</option>
          <option value="AMBIENT">Ambient</option>
        </select>
      </div>
      <div />
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
      {state.error ? <p className="col-span-full text-sm text-red-400">{state.error}</p> : null}
      <div className="col-span-full">
        <button type="submit" disabled={pending} className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-60">
          {pending ? "Creating..." : "Create product"}
        </button>
        <p className="mt-1 text-xs text-neutral-500">You can add images after creating the product.</p>
      </div>
    </form>
  );
}
