"use client";

import { MediaPickerField } from "@/components/admin/ui/media-picker-field";
import { useFormAction } from "@/lib/use-form-action";

export interface SeoFormActionState {
  error?: string;
  success?: boolean;
}

interface SeoFormProps {
  action: (prevState: SeoFormActionState, formData: FormData) => Promise<SeoFormActionState>;
  idFieldName: string;
  entityId: string;
  defaultValues: {
    titleEn?: string | null;
    titleAr?: string | null;
    descriptionEn?: string | null;
    descriptionAr?: string | null;
    canonicalUrl?: string | null;
    noIndex?: boolean;
    /** PHASE 8: social share (Open Graph) image -- falls back to Settings' default share image when empty. */
    ogImageId?: string | null;
    ogImage?: { url: string } | null;
  };
}

const initialState: SeoFormActionState = {};

export function SeoForm({ action, idFieldName, entityId, defaultValues }: SeoFormProps) {
  const [state, formAction, pending, submitKeepingInput] = useFormAction(action, initialState);

  return (
    <form action={formAction} onSubmit={submitKeepingInput} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <input type="hidden" name={idFieldName} value={entityId} />
      <div>
        <label className="mb-1 block text-xs text-neutral-400">SEO title (English)</label>
        <input
          name="titleEn"
          defaultValue={defaultValues.titleEn ?? ""}
          maxLength={200}
          className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm"
        />
      </div>
      <div dir="rtl">
        <label className="mb-1 block text-xs text-neutral-400">عنوان السيو (عربي)</label>
        <input
          name="titleAr"
          defaultValue={defaultValues.titleAr ?? ""}
          maxLength={200}
          className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Meta description (English)</label>
        <textarea
          name="descriptionEn"
          defaultValue={defaultValues.descriptionEn ?? ""}
          rows={2}
          maxLength={400}
          className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm"
        />
      </div>
      <div dir="rtl">
        <label className="mb-1 block text-xs text-neutral-400">وصف السيو (عربي)</label>
        <textarea
          name="descriptionAr"
          defaultValue={defaultValues.descriptionAr ?? ""}
          rows={2}
          maxLength={400}
          className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Canonical URL (optional)</label>
        <input
          name="canonicalUrl"
          defaultValue={defaultValues.canonicalUrl ?? ""}
          className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm"
        />
      </div>
      <label className="flex items-end gap-2 pb-1.5 text-sm text-neutral-300">
        <input type="checkbox" name="noIndex" value="true" defaultChecked={defaultValues.noIndex} />
        Hide from search engines (noindex)
      </label>
      <div className="col-span-full">
        <MediaPickerField
          name="ogImageId"
          label="Social share image (Open Graph) — optional, falls back to the site default"
          accept="IMAGE"
          uploadFolderName="Banners"
          defaultMediaId={defaultValues.ogImageId ?? null}
          defaultUrl={defaultValues.ogImage?.url}
        />
      </div>
      {state.error ? <p className="col-span-full text-sm text-red-400">{state.error}</p> : null}
      {state.success ? <p className="col-span-full text-sm text-emerald-400">Saved.</p> : null}
      <div className="col-span-full">
        <button type="submit" disabled={pending} className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-60">
          {pending ? "Saving..." : "Save SEO"}
        </button>
      </div>
    </form>
  );
}
