"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBlogPostAction, type FormActionState } from "./actions";
import { PostFormFields } from "./post-form-fields";

const initialState: FormActionState = {};

interface Option {
  id: string;
  label: string;
}

export function CreatePostForm({ categories, tags, authors }: { categories: Option[]; tags: Option[]; authors: Option[] }) {
  const [state, formAction, pending] = useActionState(createBlogPostAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success && state.id) {
      router.push(`/admin/blog/${state.id}`);
    }
  }, [state.success, state.id, router]);

  return (
    <form action={formAction} className="space-y-3">
      <PostFormFields categories={categories} tags={tags} authors={authors} />
      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-60">
        {pending ? "Creating..." : "Create post"}
      </button>
    </form>
  );
}
