"use client";

import { useActionState } from "react";
import { updateSolutionAction, type FormActionState } from "../actions";

const initialState: FormActionState = {};

interface Props {
  solution: {
    id: string;
    slug: string;
    icon: string | null;
    sortOrder: number;
    isPublished: boolean;
    translations: { locale: "EN" | "AR"; name: string; shortDescription: string | null }[];
  };
}

export function EditSolutionForm({ solution }: Props) {
  const [state, formAction, pending] = useActionState(updateSolutionAction, initialState);
  const en = solution.translations.find((t) => t.locale === "EN");
  const ar = solution.translations.find((t) => t.locale === "AR");

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={solution.id} />
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Slug</label>
        <input name="slug" defaultValue={solution.slug} required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Icon (lucide-react icon name, optional)</label>
        <input name="icon" defaultValue={solution.icon ?? ""} maxLength={40} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
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
        <label className="mb-1 block text-xs text-neutral-400">Short description (English)</label>
        <textarea name="shortDescriptionEn" defaultValue={en?.shortDescription ?? ""} rows={2} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div dir="rtl">
        <label className="mb-1 block text-xs text-neutral-400">وصف مختصر (عربي)</label>
        <textarea name="shortDescriptionAr" defaultValue={ar?.shortDescription ?? ""} rows={2} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Sort order</label>
        <input name="sortOrder" type="number" defaultValue={solution.sortOrder} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <label className="col-span-full flex items-center gap-2 text-sm text-neutral-300">
        <input type="checkbox" name="isPublished" value="true" defaultChecked={solution.isPublished} />
        Published — visible on the /solutions index and its detail page
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
