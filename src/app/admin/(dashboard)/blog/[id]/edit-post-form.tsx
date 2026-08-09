"use client";

import { useActionState } from "react";
import { updateBlogPostAction, type FormActionState } from "../actions";
import { PostFormFields } from "../post-form-fields";

const initialState: FormActionState = {};

interface Option {
  id: string;
  label: string;
}

interface Props {
  post: {
    id: string;
    slug: string;
    titleEn: string;
    titleAr: string;
    excerptEn: string | null;
    excerptAr: string | null;
    contentEn: string;
    contentAr: string;
    categoryId: string | null;
    authorId: string | null;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    publishedAt: Date | null;
    coverImageId: string | null;
    coverImage: { url: string } | null;
    tags: { id: string }[];
  };
  categories: Option[];
  tags: Option[];
  authors: Option[];
}

function toLocalDateTimeInput(date: Date | null): string {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function EditPostForm({ post, categories, tags, authors }: Props) {
  const [state, formAction, pending] = useActionState(updateBlogPostAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={post.id} />
      <PostFormFields
        categories={categories}
        tags={tags}
        authors={authors}
        defaultValues={{
          slug: post.slug,
          titleEn: post.titleEn,
          titleAr: post.titleAr,
          excerptEn: post.excerptEn,
          excerptAr: post.excerptAr,
          contentEn: post.contentEn,
          contentAr: post.contentAr,
          categoryId: post.categoryId,
          authorId: post.authorId,
          status: post.status,
          publishedAt: toLocalDateTimeInput(post.publishedAt),
          coverImageId: post.coverImageId,
          coverImageUrl: post.coverImage?.url,
          tagIds: post.tags.map((t) => t.id),
        }}
      />
      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400">Saved.</p> : null}
      <button type="submit" disabled={pending} className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-60">
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
