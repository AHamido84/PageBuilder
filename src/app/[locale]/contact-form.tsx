"use client";

import { useActionState, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { submitLeadAction, type LeadFormState } from "./lead-actions";

const initialState: LeadFormState = {};

export function ContactForm() {
  const t = useTranslations("contactForm");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(submitLeadAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="mx-auto grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
      <input type="hidden" name="locale" value={locale.toUpperCase()} />
      {/* Honeypot field — hidden from real users via CSS, left empty by them. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label className="mb-1 block text-sm text-neutral-300">{t("contactName")}</label>
        <input name="contactName" required className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-neutral-300">{t("companyName")}</label>
        <input name="companyName" className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-neutral-300">{t("email")}</label>
        <input name="email" type="email" required className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-neutral-300">{t("phone")}</label>
        <input name="phone" className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm" />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm text-neutral-300">{t("message")}</label>
        <textarea name="message" rows={4} className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm" />
      </div>

      {state.error ? <p className="text-sm text-red-400 sm:col-span-2">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400 sm:col-span-2">{t("success")}</p> : null}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 disabled:opacity-60"
        >
          {pending ? "..." : t("submit")}
        </button>
      </div>
    </form>
  );
}
