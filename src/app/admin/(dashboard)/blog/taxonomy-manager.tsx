"use client";

import { useActionState, useRef, useEffect } from "react";
import { DeleteButton } from "@/components/admin/ui/delete-button";
import {
  createBlogCategoryAction,
  deleteBlogCategoryAction,
  createTagAction,
  deleteTagAction,
  type FormActionState,
} from "./actions";

const initialState: FormActionState = {};

interface TaxonomyItem {
  id: string;
  slug: string;
  nameEn: string;
}

function TaxonomyForm({
  action,
  placeholder,
}: {
  action: (prev: FormActionState, formData: FormData) => Promise<FormActionState>;
  placeholder: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
      <input name="slug" placeholder="slug" required className="w-28 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs" />
      <input name="nameEn" placeholder={`${placeholder} (EN)`} required className="w-32 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs" />
      <input name="nameAr" placeholder={`${placeholder} (AR)`} required dir="rtl" className="w-32 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs" />
      <button type="submit" disabled={pending} className="rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-900 disabled:opacity-60">
        Add
      </button>
      {state.error ? <p className="w-full text-xs text-red-400">{state.error}</p> : null}
    </form>
  );
}

export function TaxonomyManager({ categories, tags }: { categories: TaxonomyItem[]; tags: TaxonomyItem[] }) {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="mb-2 text-sm font-medium">Blog categories</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c.id} className="flex items-center gap-1.5 rounded-full bg-neutral-800 px-2.5 py-1 text-xs">
              {c.nameEn}
              <DeleteButton onDelete={() => deleteBlogCategoryAction(c.id)} itemLabel={c.nameEn} className="text-neutral-500 hover:text-red-400">
                ×
              </DeleteButton>
            </span>
          ))}
        </div>
        <TaxonomyForm action={createBlogCategoryAction} placeholder="Category" />
      </div>
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="mb-2 text-sm font-medium">Tags</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {tags.map((t) => (
            <span key={t.id} className="flex items-center gap-1.5 rounded-full bg-neutral-800 px-2.5 py-1 text-xs">
              {t.nameEn}
              <DeleteButton onDelete={() => deleteTagAction(t.id)} itemLabel={t.nameEn} className="text-neutral-500 hover:text-red-400">
                ×
              </DeleteButton>
            </span>
          ))}
        </div>
        <TaxonomyForm action={createTagAction} placeholder="Tag" />
      </div>
    </div>
  );
}
