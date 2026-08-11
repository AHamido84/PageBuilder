"use client";

import { useActionState } from "react";
import { updatePageSlugAction, type FormActionState } from "../actions";
import { HOMEPAGE_SLUG } from "@/lib/page-builder/homepage";

const initialState: FormActionState = {};

export function PageDetailsForm({ pageId, slug }: { pageId: string; slug: string }) {
  const [state, formAction, pending] = useActionState(updatePageSlugAction, initialState);
  const isHomepage = slug === HOMEPAGE_SLUG;

  if (isHomepage) {
    return <p className="text-sm text-neutral-400">This is the homepage — it&apos;s always served at <code>/</code> and its URL can&apos;t be changed.</p>;
  }

  return (
    <form action={formAction} className="max-w-md space-y-3">
      <input type="hidden" name="id" value={pageId} />
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Slug (URL path)</label>
        <input name="slug" defaultValue={slug} required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
        <p className="mt-1 text-xs text-neutral-500">Use slashes for nested paths, e.g. &quot;company/careers&quot;.</p>
      </div>
      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400">Saved.</p> : null}
      <button type="submit" disabled={pending} className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-60">
        {pending ? "Saving..." : "Save slug"}
      </button>
    </form>
  );
}
