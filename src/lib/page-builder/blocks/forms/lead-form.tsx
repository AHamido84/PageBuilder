"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { TextField, TextareaField, CheckboxField, SelectField } from "@/components/admin/ui/field";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { submitBlockLeadAction } from "@/app/[locale]/page-builder-lead-action";
import type { LeadFormState } from "@/lib/leads/submit-lead";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import type { LeadFormData } from "../forms-blocks";

const initialState: LeadFormState = {};
const inputClasses = "w-full rounded-[var(--radius-sm)] border border-ink/15 bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-ink/35 focus:border-harbor";

const INQUIRY_TYPES = ["GENERAL", "QUOTE", "BECOME_CUSTOMER", "SALES_INQUIRY"] as const;
type InquiryType = (typeof INQUIRY_TYPES)[number];

const FORM_LABELS = {
  en: {
    name: "Name", company: "Company", email: "Email", phone: "Phone", message: "Message", website: "Website",
    sending: "Sending…", send: "Send", thanks: "Thanks — we'll be in touch.",
    inquiryType: { GENERAL: "General inquiry", QUOTE: "Request a quote", BECOME_CUSTOMER: "Become a customer", SALES_INQUIRY: "Sales inquiry" },
  },
  ar: {
    name: "الاسم", company: "الشركة", email: "البريد الإلكتروني", phone: "الهاتف", message: "الرسالة", website: "الموقع الإلكتروني",
    sending: "جارٍ الإرسال…", send: "إرسال", thanks: "شكرًا لك — سنتواصل معك قريبًا.",
    inquiryType: { GENERAL: "استفسار عام", QUOTE: "اطلب عرض سعر", BECOME_CUSTOMER: "أصبح عميلاً", SALES_INQUIRY: "استفسار مبيعات" },
  },
} as const;

export function LeadFormEdit({ data, onChange, locale }: BlockEditProps<LeadFormData>) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <div className="space-y-3">
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={dir} />
      <TextareaField label="Body" value={data.body ?? ""} onChange={(body) => onChange({ ...data, body })} dir={dir} rows={2} />
      <TextField label="Submit button label" value={data.submitLabel ?? ""} onChange={(submitLabel) => onChange({ ...data, submitLabel })} dir={dir} />
      <CheckboxField label="Include a message field" checked={data.showMessage} onChange={(showMessage) => onChange({ ...data, showMessage })} />
      <CheckboxField
        label="Let the visitor pick the inquiry type (General / Quote / Become a customer / Sales)"
        checked={data.showTypeSelector ?? false}
        onChange={(showTypeSelector) => onChange({ ...data, showTypeSelector })}
      />
      {!data.showTypeSelector ? (
        <SelectField
          label="Inquiry type (which CRM pipeline this submits to)"
          value={data.inquiryType}
          onChange={(inquiryType) => onChange({ ...data, inquiryType: inquiryType as LeadFormData["inquiryType"] })}
          options={[
            { value: "GENERAL", label: "General" },
            { value: "QUOTE", label: "Request a quote" },
            { value: "BECOME_CUSTOMER", label: "Become a customer" },
            { value: "SALES_INQUIRY", label: "Sales inquiry" },
          ]}
        />
      ) : null}
    </div>
  );
}

export function LeadFormRender({ data, locale, interactive }: BlockRenderProps<LeadFormData>) {
  const [state, formAction, pending] = useActionState(submitBlockLeadAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedType, setSelectedType] = useState<InquiryType>("GENERAL");
  const t = locale === "ar" ? FORM_LABELS.ar : FORM_LABELS.en;

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  const submittedInquiryType = data.showTypeSelector ? selectedType : data.inquiryType;

  return (
    <div className="mx-auto max-w-xl">
      {data.heading ? <h2 className="text-center font-display text-3xl">{data.heading}</h2> : null}
      {data.body ? <p className="mt-3 text-center opacity-65">{data.body}</p> : null}
      <form ref={formRef} action={interactive ? formAction : undefined} className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input type="hidden" name="locale" value={locale.toUpperCase()} />
        <input type="hidden" name="inquiryType" value={submittedInquiryType} />
        <div className="hidden" aria-hidden="true">
          <label htmlFor="website">{t.website}</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        {data.showTypeSelector ? (
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            {INQUIRY_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                disabled={!interactive}
                onClick={() => setSelectedType(type)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                  selectedType === type ? "border-ink bg-ink text-paper" : "border-ink/15 text-ink/60 hover:border-ink/40"
                )}
              >
                {t.inquiryType[type]}
              </button>
            ))}
          </div>
        ) : null}

        <div>
          <label className="mb-1.5 block text-sm opacity-60">{t.name}</label>
          <input name="contactName" required className={inputClasses} disabled={!interactive} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm opacity-60">{t.company}</label>
          <input name="companyName" className={inputClasses} disabled={!interactive} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm opacity-60">{t.email}</label>
          <input name="email" type="email" dir="ltr" required className={`${inputClasses} text-end`} disabled={!interactive} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm opacity-60">{t.phone}</label>
          <input name="phone" type="tel" dir="ltr" className={`${inputClasses} text-end`} disabled={!interactive} />
        </div>
        {data.showMessage ? (
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm opacity-60">{t.message}</label>
            <textarea name="message" rows={4} className={inputClasses} disabled={!interactive} />
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <button type="submit" disabled={pending || !interactive} className={buttonClasses("primary", "lg", "w-full sm:w-auto")}>
            {pending ? t.sending : data.submitLabel || t.send}
          </button>
          {state.success ? <p className="mt-2 text-sm text-emerald-600">{t.thanks}</p> : null}
          {state.error ? <p className="mt-2 text-sm text-red-600">{state.error}</p> : null}
        </div>
      </form>
    </div>
  );
}
