"use client";

import { useActionState } from "react";
import { TextField } from "@/components/admin/ui/field";
import { buttonClasses } from "@/components/ui/button";
import { subscribeNewsletterAction, type NewsletterState } from "@/app/[locale]/newsletter-actions";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import type { NewsletterData } from "../forms-blocks";

const initialState: NewsletterState = {};

export function NewsletterEdit({ data, onChange, locale }: BlockEditProps<NewsletterData>) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <div className="space-y-3">
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={dir} />
      <TextField label="Body" value={data.body ?? ""} onChange={(body) => onChange({ ...data, body })} dir={dir} />
      <TextField label="Submit button label" value={data.submitLabel ?? ""} onChange={(submitLabel) => onChange({ ...data, submitLabel })} dir={dir} />
    </div>
  );
}

export function NewsletterRender({ data, locale, interactive }: BlockRenderProps<NewsletterData>) {
  const [state, formAction, pending] = useActionState(subscribeNewsletterAction, initialState);
  return (
    <div className="mx-auto max-w-md text-center">
      {data.heading ? <h2 className="font-display text-2xl">{data.heading}</h2> : null}
      {data.body ? <p className="mt-2 text-sm opacity-65">{data.body}</p> : null}
      <form action={interactive ? formAction : undefined} className="mt-5 flex gap-2">
        <input type="hidden" name="locale" value={locale.toUpperCase()} />
        <input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          disabled={!interactive}
          className="flex-1 rounded-[var(--radius-sm)] border border-current/15 bg-transparent px-3 py-2.5 text-sm placeholder:opacity-40"
        />
        <button type="submit" disabled={pending || !interactive} className={buttonClasses("primary", "md")}>
          {pending ? "…" : data.submitLabel || "Subscribe"}
        </button>
      </form>
      {state.success ? <p className="mt-2 text-sm text-emerald-500">Subscribed.</p> : null}
      {state.error ? <p className="mt-2 text-sm text-red-500">{state.error}</p> : null}
    </div>
  );
}
