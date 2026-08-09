"use client";

import { useActionState, useRef, useEffect } from "react";
import { TextField, TextareaField, CheckboxField } from "@/components/admin/ui/field";
import { buttonClasses } from "@/components/ui/button";
import { submitBlockLeadAction } from "@/app/[locale]/page-builder-lead-action";
import type { LeadFormState } from "@/lib/leads/submit-lead";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import type { LeadFormData } from "../forms-blocks";

const initialState: LeadFormState = {};
const inputClasses = "w-full rounded-[var(--radius-sm)] border border-ink/15 bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-ink/35 focus:border-harbor";

export function LeadFormEdit({ data, onChange, locale }: BlockEditProps<LeadFormData>) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <div className="space-y-3">
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={dir} />
      <TextareaField label="Body" value={data.body ?? ""} onChange={(body) => onChange({ ...data, body })} dir={dir} rows={2} />
      <TextField label="Submit button label" value={data.submitLabel ?? ""} onChange={(submitLabel) => onChange({ ...data, submitLabel })} dir={dir} />
      <CheckboxField label="Include a message field" checked={data.showMessage} onChange={(showMessage) => onChange({ ...data, showMessage })} />
    </div>
  );
}

export function LeadFormRender({ data, locale, interactive }: BlockRenderProps<LeadFormData>) {
  const [state, formAction, pending] = useActionState(submitBlockLeadAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <div className="mx-auto max-w-xl">
      {data.heading ? <h2 className="text-center font-display text-3xl">{data.heading}</h2> : null}
      {data.body ? <p className="mt-3 text-center opacity-65">{data.body}</p> : null}
      <form ref={formRef} action={interactive ? formAction : undefined} className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input type="hidden" name="locale" value={locale.toUpperCase()} />
        <div className="hidden" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm opacity-60">Name</label>
          <input name="contactName" required className={inputClasses} disabled={!interactive} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm opacity-60">Company</label>
          <input name="companyName" className={inputClasses} disabled={!interactive} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm opacity-60">Email</label>
          <input name="email" type="email" required className={inputClasses} disabled={!interactive} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm opacity-60">Phone</label>
          <input name="phone" className={inputClasses} disabled={!interactive} />
        </div>
        {data.showMessage ? (
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm opacity-60">Message</label>
            <textarea name="message" rows={4} className={inputClasses} disabled={!interactive} />
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <button type="submit" disabled={pending || !interactive} className={buttonClasses("primary", "lg", "w-full sm:w-auto")}>
            {pending ? "Sending…" : data.submitLabel || "Send"}
          </button>
          {state.success ? <p className="mt-2 text-sm text-emerald-600">Thanks — we'll be in touch.</p> : null}
          {state.error ? <p className="mt-2 text-sm text-red-600">{state.error}</p> : null}
        </div>
      </form>
    </div>
  );
}
