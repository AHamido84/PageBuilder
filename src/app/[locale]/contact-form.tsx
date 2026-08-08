"use client";

import { useActionState, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { submitLeadAction, type LeadFormState } from "./lead-actions";
import { buttonClasses } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const initialState: LeadFormState = {};

const inputClasses =
  "w-full rounded-[var(--radius-sm)] border border-ink/15 bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-ink/35 focus:border-harbor";

export function ContactForm({ defaultProductName }: { defaultProductName?: string }) {
  const t = useTranslations("contactForm");
  const locale = useLocale();
  const toast = useToast();
  const [state, formAction, pending] = useActionState(submitLeadAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      toast.push({ title: t("success"), tone: "default" });
    } else if (state.error) {
      toast.push({ title: state.error, tone: "error" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <form ref={formRef} action={formAction} className="mx-auto grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
      <input type="hidden" name="locale" value={locale.toUpperCase()} />
      {defaultProductName ? <input type="hidden" name="message" value={`Inquiry: ${defaultProductName}`} /> : null}
      {/* Honeypot field — hidden from real users via CSS, left empty by them. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-ink/60">{t("contactName")}</label>
        <input name="contactName" required className={inputClasses} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-ink/60">{t("companyName")}</label>
        <input name="companyName" className={inputClasses} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-ink/60">{t("email")}</label>
        <input name="email" type="email" required className={inputClasses} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-ink/60">{t("phone")}</label>
        <input name="phone" className={inputClasses} />
      </div>
      {!defaultProductName ? (
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm text-ink/60">{t("message")}</label>
          <textarea name="message" rows={4} className={inputClasses} />
        </div>
      ) : null}

      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className={buttonClasses("primary", "lg", "w-full sm:w-auto")}>
          {pending ? t("submitting") : t("submit")}
        </button>
      </div>
    </form>
  );
}
