"use client";

import { updatePageSlugAction, type FormActionState } from "../actions";
import { HOMEPAGE_SLUG } from "@/lib/page-builder/homepage";
import { useFormAction } from "@/lib/use-form-action";

const initialState: FormActionState = {};
const inputClass = "w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm";

export function PageDetailsForm({ pageId, slug, titleEn, titleAr }: { pageId: string; slug: string; titleEn: string | null; titleAr: string | null }) {
  const [state, formAction, pending, submitKeepingInput] = useFormAction(updatePageSlugAction, initialState);
  const isHomepage = slug === HOMEPAGE_SLUG;
  // Homepage + reserved header/solution pages: the slug is fixed, only the titles are editable.
  const slugLocked = isHomepage || slug.startsWith("__");

  return (
    <form action={formAction} onSubmit={submitKeepingInput} className="max-w-xl space-y-3">
      <input type="hidden" name="id" value={pageId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Title (English)</label>
          <input name="titleEn" defaultValue={titleEn ?? ""} maxLength={200} className={inputClass} />
        </div>
        <div dir="rtl">
          <label className="mb-1 block text-xs text-neutral-400">العنوان (عربي)</label>
          <input name="titleAr" defaultValue={titleAr ?? ""} maxLength={200} className={inputClass} />
        </div>
      </div>
      <p className="text-xs text-neutral-500">Used in the admin and as the browser/search title when the SEO tab has no meta title. Empty = derived from the slug.</p>
      {slugLocked ? (
        <p className="text-sm text-neutral-400">
          {isHomepage ? (
            <>This is the homepage — it&apos;s always served at <code>/</code> and its URL can&apos;t be changed.</>
          ) : (
            <>This is a reserved page (<code>{slug}</code>) attached to another part of the site; its slug can&apos;t be changed.</>
          )}
        </p>
      ) : (
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Slug (URL path)</label>
          <input name="slug" defaultValue={slug} required className={inputClass} />
          <p className="mt-1 text-xs text-neutral-500">Use slashes for nested paths, e.g. &quot;company/careers&quot;.</p>
        </div>
      )}
      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400">Saved.</p> : null}
      <button type="submit" disabled={pending} className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-60">
        {pending ? "Saving..." : "Save details"}
      </button>
    </form>
  );
}
