"use client";

import { updateCategoryAction, type FormActionState } from "../actions";
import { MediaPickerField } from "@/components/admin/ui/media-picker-field";
import { useFormAction } from "@/lib/use-form-action";

const initialState: FormActionState = {};

interface Props {
  category: {
    id: string;
    slug: string;
    icon: string | null;
    order: number;
    isActive: boolean;
    isFeatured: boolean;
    featuredOrder: number | null;
    parentId: string | null;
    imageId: string | null;
    image: { url: string } | null;
    bannerId: string | null;
    banner: { url: string } | null;
    translations: { locale: "EN" | "AR"; name: string; description: string | null }[];
  };
  categories: { id: string; slug: string }[];
}

export function EditCategoryForm({ category, categories }: Props) {
  const [state, formAction, pending, submitKeepingInput] = useFormAction(updateCategoryAction, initialState);
  const en = category.translations.find((t) => t.locale === "EN");
  const ar = category.translations.find((t) => t.locale === "AR");

  return (
    <form action={formAction} onSubmit={submitKeepingInput} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={category.id} />
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Slug</label>
        <input name="slug" defaultValue={category.slug} required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Icon (emoji, optional)</label>
        <input name="icon" defaultValue={category.icon ?? ""} maxLength={10} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Parent category</label>
        <select name="parentId" defaultValue={category.parentId ?? ""} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm">
          <option value="">None</option>
          {categories
            .filter((c) => c.id !== category.id)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.slug}
              </option>
            ))}
        </select>
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
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Order</label>
        <input name="order" type="number" defaultValue={category.order} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <MediaPickerField name="imageId" label="Image" accept="IMAGE" uploadFolderName="Categories" defaultMediaId={category.imageId} defaultUrl={category.image?.url} />
      <MediaPickerField
        name="bannerId"
        label="Banner (wide header on this category's product listing)"
        accept="IMAGE"
        uploadFolderName="Banners"
        defaultMediaId={category.bannerId}
        defaultUrl={category.banner?.url}
      />
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Featured order (optional)</label>
        <input
          name="featuredOrder"
          type="number"
          defaultValue={category.featuredOrder ?? ""}
          placeholder="Falls back to Order above"
          className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm"
        />
      </div>
      <label className="col-span-full flex items-center gap-2 text-sm text-neutral-300">
        <input type="checkbox" name="isActive" value="true" defaultChecked={category.isActive} />
        Active
      </label>
      <label className="col-span-full flex items-center gap-2 text-sm text-neutral-300">
        <input type="checkbox" name="isFeatured" value="true" defaultChecked={category.isFeatured} />
        Featured category — show in the dynamic Featured Categories section
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
