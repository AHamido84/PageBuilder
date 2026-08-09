"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPageAction, type FormActionState } from "./actions";

const initialState: FormActionState = {};

export function CreatePageForm() {
  const [state, formAction, pending] = useActionState(createPageAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success && state.id) router.push(`/admin/pages/${state.id}`);
  }, [state.success, state.id, router]);

  return (
    <form action={formAction} className="flex items-end gap-2">
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Slug</label>
        <input name="slug" required placeholder="quality-food-safety" className="w-64 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <button type="submit" disabled={pending} className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-60">
        {pending ? "Creating..." : "Create page"}
      </button>
      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
    </form>
  );
}
