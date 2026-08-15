"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Loader2 } from "lucide-react";
import { submitLeadAction, type LeadFormState } from "./lead-actions";
import { buttonClasses } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const initialState: LeadFormState = {};

const inputClasses =
  "w-full rounded-[var(--radius-sm)] border border-ink/15 bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-ink/35 transition-[border-color,box-shadow] duration-200 focus:border-harbor focus:shadow-[var(--shadow-focus)] focus:outline-none";

const INQUIRY_TYPES = ["GENERAL", "QUOTE", "BECOME_CUSTOMER", "SALES_INQUIRY"] as const;
type InquiryType = (typeof INQUIRY_TYPES)[number];

interface ContactFormProps {
  /** When set, renders product-inquiry mode: links the lead to this product and shows two distinct submit actions instead of one generic "Send". */
  productId?: string;
  /** Shows the General/Quote/Become a Customer/Sales Inquiry tab selector -- only used on the standalone /contact page. */
  showTypeSelector?: boolean;
}

export function ContactForm({ productId, showTypeSelector }: ContactFormProps) {
  const t = useTranslations("contactForm");
  const tDetail = useTranslations("productDetail");
  const locale = useLocale();
  const toast = useToast();
  const [state, formAction, pending] = useActionState(submitLeadAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [inquiryType, setInquiryType] = useState<InquiryType>("GENERAL");

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      toast.push({ title: t("success"), tone: "default" });
    } else if (state.error) {
      toast.push({ title: state.error, tone: "error" });
    }
    // Depend on the whole `state` object, not the destructured booleans -- submitLeadAction returns
    // a fresh object literal each call, so a second submission resolving to the same value (e.g.
    // success -> success) still changes identity and should re-fire this effect. Depending on
    // state.success/state.error only catches the false->true transition, silently dropping the
    // confirmation toast on a second submit within the same page session (found via live testing).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="mx-auto grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
      <input type="hidden" name="locale" value={locale.toUpperCase()} />
      {productId ? <input type="hidden" name="productId" value={productId} /> : null}
      {showTypeSelector ? <input type="hidden" name="inquiryType" value={inquiryType} /> : null}
      {/* Honeypot field — hidden from real users via CSS, left empty by them. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {showTypeSelector ? (
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          {INQUIRY_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setInquiryType(type)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                inquiryType === type ? "border-ink bg-ink text-paper" : "border-ink/15 text-ink/60 hover:border-ink/40"
              }`}
            >
              {t(`inquiryType.${type}`)}
            </button>
          ))}
        </div>
      ) : null}

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
        <input name="email" type="email" dir="ltr" required className={`${inputClasses} text-end`} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-ink/60">{t("phone")}</label>
        <input name="phone" type="tel" dir="ltr" className={`${inputClasses} text-end`} />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-sm text-ink/60">{t("message")}</label>
        <textarea name="message" rows={4} className={inputClasses} />
      </div>

      <div className="flex flex-wrap gap-3 sm:col-span-2">
        {productId ? (
          <>
            <button
              type="submit"
              name="inquiryType"
              value="INFO"
              disabled={pending}
              className={`${buttonClasses("secondary", "lg")} inline-flex items-center justify-center gap-2`}
            >
              {pending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
              {pending ? t("submitting") : tDetail("requestInfo")}
            </button>
            <button
              type="submit"
              name="inquiryType"
              value="QUOTE"
              disabled={pending}
              className={`${buttonClasses("primary", "lg")} inline-flex items-center justify-center gap-2`}
            >
              {pending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
              {pending ? t("submitting") : tDetail("requestQuote")}
            </button>
          </>
        ) : (
          <button
            type="submit"
            disabled={pending}
            className={`${buttonClasses("primary", "lg", "w-full sm:w-auto")} inline-flex items-center justify-center gap-2`}
          >
            {pending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
            {pending ? t("submitting") : t("submit")}
          </button>
        )}
      </div>
    </form>
  );
}
