"use client";

import { useRef, useEffect, useState, useContext } from "react";
import { Loader2 } from "lucide-react";
import { TextField, TextareaField, CheckboxField, SelectField, styledProps } from "@/components/admin/ui/field";
import { StyledText } from "@/components/text/styled-text";
import { richOf } from "@/lib/text-style/rich-text";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ToastContext } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { MediaPickerControlled } from "@/components/admin/ui/media-picker-field";
import { CmsFillImage } from "@/components/media/cms-image";
import { submitBlockLeadAction } from "@/app/[locale]/page-builder-lead-action";
import type { LeadFormState } from "@/lib/leads/submit-lead";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import type { LeadFormData } from "../forms-blocks";
import { useFormAction } from "@/lib/use-form-action";

const initialState: LeadFormState = {};
const inputClasses =
  "w-full rounded-[var(--radius-md)] border border-line-strong bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink/35 transition-[border-color,box-shadow] duration-200 focus:border-harbor focus:shadow-[var(--shadow-focus)] focus:outline-none";

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
  const aside: NonNullable<LeadFormData["aside"]> = { image: null, eyebrow: "", heading: "", body: "", ...data.aside };
  const setAside = (next: NonNullable<LeadFormData["aside"]>) => onChange({ ...data, aside: next });
  return (
    <div className="space-y-3">
      <TextField label="Heading" {...styledProps(data, "heading", onChange)} dir={dir} />
      <TextareaField label="Body" {...styledProps(data, "body", onChange)} dir={dir} rows={2} />
      <TextField label="Submit button label" {...styledProps(data, "submitLabel", onChange)} dir={dir} />
      <SelectField
        label="Submit button style"
        value={data.buttonStyle ?? "primary"}
        onChange={(buttonStyle) => onChange({ ...data, buttonStyle: buttonStyle as LeadFormData["buttonStyle"] })}
        options={[
          { value: "primary", label: "Primary" },
          { value: "secondary", label: "Secondary" },
          { value: "gold", label: "Gold" },
        ]}
      />
      <SelectField
        label="Layout"
        value={data.layout ?? "centered"}
        onChange={(layout) => onChange({ ...data, layout: layout as LeadFormData["layout"] })}
        options={[
          { value: "centered", label: "Centered form" },
          { value: "split", label: "Split — form + image panel" },
        ]}
      />
      {data.layout === "split" ? (
        <div className="space-y-2 rounded-md border border-neutral-800 p-3">
          <p className="text-xs font-medium text-neutral-500">Side panel</p>
          <MediaPickerControlled
            label="Panel image"
            uploadFolderName="Banners"
            mediaId={data.aside?.image?.id ?? ""}
            previewUrl={data.aside?.image?.url}
            onChange={(id, url) => onChange({ ...data, aside: { eyebrow: "", heading: "", body: "", ...data.aside, image: id ? { id, url } : null } })}
          />
          {(["eyebrow", "heading"] as const).map((field) => (
            <TextField key={field} label={field === "eyebrow" ? "Panel eyebrow" : "Panel heading"} {...styledProps(aside, field, setAside)} dir={dir} />
          ))}
          <TextareaField label="Panel text" {...styledProps(aside, "body", setAside)} dir={dir} rows={2} />
        </div>
      ) : null}
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

      <div className="space-y-3 rounded-md border border-neutral-800 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Field labels (optional — blank uses the default translation)</p>
        <TextField label="Name field" {...styledProps(data, "nameLabel", onChange)} dir={dir} />
        <TextField label="Company field" {...styledProps(data, "companyLabel", onChange)} dir={dir} />
        <TextField label="Email field" {...styledProps(data, "emailLabel", onChange)} dir={dir} />
        <TextField label="Phone field" {...styledProps(data, "phoneLabel", onChange)} dir={dir} />
        {data.showMessage ? (
          <TextField label="Message field" {...styledProps(data, "messageLabel", onChange)} dir={dir} />
        ) : null}
      </div>
    </div>
  );
}

export function LeadFormRender({ data, locale, interactive }: BlockRenderProps<LeadFormData>) {
  const [state, formAction, pending, submitKeepingInput] = useFormAction(submitBlockLeadAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedType, setSelectedType] = useState<InquiryType>("GENERAL");
  const t = locale === "ar" ? FORM_LABELS.ar : FORM_LABELS.en;
  // useContext directly (not the throwing useToast()) -- this Render also mounts inside the admin
  // canvas, which sits under a different layout tree without the public ToastProvider.
  const toast = useContext(ToastContext);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      toast?.push({ title: t.thanks, tone: "default" });
    } else if (state.error) {
      toast?.push({ title: state.error, tone: "error" });
    }
    // Depend on the whole `state` object, not `state.success`/`state.error` -- submitBlockLeadAction
    // returns a fresh object literal on every call, so a second submission that resolves to the
    // same boolean value (e.g. success -> success) still changes object identity and re-fires this
    // effect. Depending on the destructured booleans instead would only fire on the false->true
    // transition, silently dropping the confirmation on a second submit in the same page session.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast identity is stable from context.
  }, [state]);

  const submittedInquiryType = data.showTypeSelector ? selectedType : data.inquiryType;

  const split = data.layout === "split";
  const formCard = (
      <Card variant="default" className={split ? "mt-8 p-6 sm:p-8" : "mt-10 p-6 sm:p-8"}>
        <form ref={formRef} action={interactive ? formAction : undefined} onSubmit={interactive ? submitKeepingInput : undefined} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                    selectedType === type ? "border-ink bg-ink text-paper" : "border-line-strong text-ink/60 hover:border-ink/40"
                  )}
                >
                  {t.inquiryType[type]}
                </button>
              ))}
            </div>
          ) : null}

          <div>
            <label className="mb-1.5 block text-sm opacity-60">{data.nameLabel ? <StyledText text={data.nameLabel} rich={richOf(data, "nameLabel")} /> : t.name}</label>
            <input name="contactName" required className={inputClasses} disabled={!interactive} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm opacity-60">{data.companyLabel ? <StyledText text={data.companyLabel} rich={richOf(data, "companyLabel")} /> : t.company}</label>
            <input name="companyName" className={inputClasses} disabled={!interactive} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm opacity-60">{data.emailLabel ? <StyledText text={data.emailLabel} rich={richOf(data, "emailLabel")} /> : t.email}</label>
            <input name="email" type="email" dir="ltr" required className={`${inputClasses} text-end`} disabled={!interactive} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm opacity-60">{data.phoneLabel ? <StyledText text={data.phoneLabel} rich={richOf(data, "phoneLabel")} /> : t.phone}</label>
            <input name="phone" type="tel" dir="ltr" className={`${inputClasses} text-end`} disabled={!interactive} />
          </div>
          {data.showMessage ? (
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm opacity-60">{data.messageLabel ? <StyledText text={data.messageLabel} rich={richOf(data, "messageLabel")} /> : t.message}</label>
              <textarea name="message" rows={4} className={inputClasses} disabled={!interactive} />
            </div>
          ) : null}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={pending || !interactive}
              className={cn(buttonClasses(data.buttonStyle ?? "primary", "lg", "w-full sm:w-auto"), "inline-flex items-center justify-center gap-2")}
            >
              {pending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
              {pending ? t.sending : data.submitLabel ? <StyledText text={data.submitLabel} rich={richOf(data, "submitLabel")} /> : t.send}
            </button>
          </div>
        </form>
      </Card>
  );

  if (!split) {
    return (
      <div className="mx-auto max-w-xl">
        {data.heading ? <h2 className="text-center font-display text-h2"><StyledText text={data.heading} rich={richOf(data, "heading")} /></h2> : null}
        {data.body ? <p className="mx-auto mt-4 max-w-md text-center opacity-65"><StyledText text={data.body} rich={richOf(data, "body")} /></p> : null}
        {formCard}
      </div>
    );
  }

  const aside = data.aside;
  return (
    <div className="grid items-stretch gap-8 lg:grid-cols-2 lg:gap-12">
      <div>
        {data.heading ? <h2 className="font-display text-h2"><StyledText text={data.heading} rich={richOf(data, "heading")} /></h2> : null}
        {data.body ? <p className="mt-4 max-w-md opacity-65"><StyledText text={data.body} rich={richOf(data, "body")} /></p> : null}
        {formCard}
      </div>
      <div className="relative flex min-h-[22rem] flex-col justify-end overflow-hidden rounded-[var(--card-radius-xl)] bg-petrol p-8 text-paper sm:p-10">
        {aside?.image?.url ? (
          <>
            <CmsFillImage src={aside.image.url} alt={aside.heading || ""} sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-petrol via-petrol/40 to-transparent" />
          </>
        ) : null}
        <div className="relative">
          {aside?.eyebrow ? <p className="manifest-strip mb-3 text-wheat"><StyledText text={aside.eyebrow} rich={richOf(aside, "eyebrow")} /></p> : null}
          {aside?.heading ? <p className="font-display text-h2 leading-tight"><StyledText text={aside.heading} rich={richOf(aside, "heading")} /></p> : null}
          {aside?.body ? <p className="mt-3 max-w-sm text-paper/80"><StyledText text={aside.body} rich={richOf(aside, "body")} /></p> : null}
        </div>
      </div>
    </div>
  );
}
