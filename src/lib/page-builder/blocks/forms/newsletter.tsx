"use client";

import { useActionState } from "react";
import { TextField } from "@/components/admin/ui/field";
import { SegmentedControl } from "@/components/admin/ui/segmented-control";
import { buttonClasses } from "@/components/ui/button";
import { KineticText } from "@/lib/motion/primitives";
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
      <SegmentedControl
        value={data.layout}
        onChange={(layout) => onChange({ ...data, layout })}
        options={[
          { value: "compact", label: "Compact bar" },
          { value: "panel", label: "Full-width panel" },
        ]}
      />
    </div>
  );
}

function SubscribeForm({ data, locale, interactive, className }: BlockRenderProps<NewsletterData> & { className?: string }) {
  const [state, formAction, pending] = useActionState(subscribeNewsletterAction, initialState);
  return (
    <div className={className}>
      <form action={interactive ? formAction : undefined} className="flex gap-2">
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

export function NewsletterRender(props: BlockRenderProps<NewsletterData>) {
  const { data } = props;

  if (data.layout === "panel") {
    return (
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-lg">
          {data.heading ? <KineticText as="h2" text={data.heading} className="font-display text-h1 leading-[1.05]" /> : null}
          {data.body ? <p className="mt-4 text-lg opacity-70">{data.body}</p> : null}
        </div>
        <SubscribeForm {...props} className="w-full lg:w-auto lg:min-w-[380px]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md text-center">
      {data.heading ? <h2 className="font-display text-2xl">{data.heading}</h2> : null}
      {data.body ? <p className="mt-2 text-sm opacity-65">{data.body}</p> : null}
      <SubscribeForm {...props} className="mt-5" />
    </div>
  );
}
