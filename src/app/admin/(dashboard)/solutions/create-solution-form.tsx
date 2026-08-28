"use client";

import { useActionState, useRef, useEffect } from "react";
import { createSolutionAction, type FormActionState } from "./actions";

const initialState: FormActionState = {};

export function CreateSolutionForm() {
  const [state, formAction, pending] = useActionState(createSolutionAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Slug</label>
        <input name="slug" required placeholder="hospitality" className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Icon (lucide-react icon name, optional)</label>
        <input name="icon" placeholder="BedDouble" maxLength={40} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
        <p className="mt-1 text-[11px] text-neutral-500">
          Exact component name from{" "}
          <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" className="underline">
            lucide.dev/icons
          </a>
          , e.g. BedDouble, UtensilsCrossed. Falls back to a generic tag icon if left blank or unrecognized.
        </p>
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
        <label className="mb-1 block text-xs text-neutral-400">Short description (English)</label>
        <textarea name="shortDescriptionEn" rows={2} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div dir="rtl">
        <label className="mb-1 block text-xs text-neutral-400">وصف مختصر (عربي)</label>
        <textarea name="shortDescriptionAr" rows={2} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Sort order</label>
        <input name="sortOrder" type="number" defaultValue={0} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      {state.error ? <p className="col-span-full text-sm text-red-400">{state.error}</p> : null}
      <div className="col-span-full">
        <button type="submit" disabled={pending} className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-60">
          {pending ? "Adding..." : "Add solution"}
        </button>
      </div>
    </form>
  );
}
