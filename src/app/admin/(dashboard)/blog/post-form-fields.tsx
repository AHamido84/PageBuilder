"use client";

import { MediaPickerField } from "@/components/admin/ui/media-picker-field";

interface Option {
  id: string;
  label: string;
}

interface PostFormFieldsProps {
  categories: Option[];
  tags: Option[];
  authors: Option[];
  defaultValues?: {
    slug?: string;
    titleEn?: string;
    titleAr?: string;
    excerptEn?: string | null;
    excerptAr?: string | null;
    contentEn?: string;
    contentAr?: string;
    categoryId?: string | null;
    authorId?: string | null;
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    publishedAt?: string | null;
    coverImageId?: string | null;
    coverImageUrl?: string | null;
    tagIds?: string[];
  };
}

export function PostFormFields({ categories, tags, authors, defaultValues = {} }: PostFormFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Slug</label>
        <input name="slug" defaultValue={defaultValues.slug} required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Status</label>
        <select name="status" defaultValue={defaultValues.status ?? "DRAFT"} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm">
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Title (English)</label>
        <input name="titleEn" defaultValue={defaultValues.titleEn} required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div dir="rtl">
        <label className="mb-1 block text-xs text-neutral-400">العنوان (عربي)</label>
        <input name="titleAr" defaultValue={defaultValues.titleAr} required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Excerpt (English)</label>
        <textarea name="excerptEn" defaultValue={defaultValues.excerptEn ?? ""} rows={2} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div dir="rtl">
        <label className="mb-1 block text-xs text-neutral-400">مقتطف (عربي)</label>
        <textarea name="excerptAr" defaultValue={defaultValues.excerptAr ?? ""} rows={2} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Content (English)</label>
        <textarea name="contentEn" defaultValue={defaultValues.contentEn} required rows={8} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div dir="rtl">
        <label className="mb-1 block text-xs text-neutral-400">المحتوى (عربي)</label>
        <textarea name="contentAr" defaultValue={defaultValues.contentAr} required rows={8} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Category</label>
        <select name="categoryId" defaultValue={defaultValues.categoryId ?? ""} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm">
          <option value="">None</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Author</label>
        <select name="authorId" defaultValue={defaultValues.authorId ?? ""} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm">
          <option value="">Me</option>
          {authors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Publish date (leave blank = now, future date = scheduled)</label>
        <input
          type="datetime-local"
          name="publishedAt"
          defaultValue={defaultValues.publishedAt ?? ""}
          className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm"
        />
      </div>
      <MediaPickerField name="coverImageId" label="Cover image" accept="IMAGE" defaultMediaId={defaultValues.coverImageId ?? undefined} defaultUrl={defaultValues.coverImageUrl ?? undefined} />
      <div className="col-span-full">
        <label className="mb-1 block text-xs text-neutral-400">Tags</label>
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <label key={tag.id} className="flex items-center gap-1.5 text-sm text-neutral-300">
              <input type="checkbox" name="tagIds" value={tag.id} defaultChecked={defaultValues.tagIds?.includes(tag.id)} />
              {tag.label}
            </label>
          ))}
          {tags.length === 0 ? <p className="text-xs text-neutral-500">No tags yet — add some above.</p> : null}
        </div>
      </div>
    </div>
  );
}
