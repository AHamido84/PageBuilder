"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { TextField } from "@/components/admin/ui/field";
import { useFormAction } from "@/lib/use-form-action";
import { cn } from "@/lib/cn";
import { submitQuoteRequestAction } from "@/app/[locale]/page-builder-lead-action";
import type { LeadFormState } from "@/lib/leads/submit-lead";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import type { G7Option, G7QuoteData } from "./schema";
import { G7Arrow, G7ImageField, G7ListEditor, g7Eyebrow, g7GoldButton } from "./shared";

const initialState: LeadFormState = {};

const MESSAGES = {
  ar: {
    nameRequired: "يرجى إدخال اسمك.",
    phoneRequired: "يرجى إدخال رقم التواصل.",
    phoneInvalid: "يرجى إدخال رقم تواصل صحيح.",
    sending: "جارٍ الإرسال…",
    success: "شكرًا لك! استلمنا طلبك وسنتواصل معك قريبًا.",
    another: "إرسال طلب آخر",
    honeypot: "اترك هذا الحقل فارغًا",
  },
  en: {
    nameRequired: "Please enter your name.",
    phoneRequired: "Please enter your phone number.",
    phoneInvalid: "Please enter a valid phone number.",
    sending: "Sending…",
    success: "Thank you! We've received your request and will be in touch soon.",
    another: "Send another request",
    honeypot: "Leave this field empty",
  },
};

type FieldErrors = Partial<Record<"contactName" | "phone", string>>;

/** Three stacked outlined diamonds (design ornament), drawn in SVG. */
function DiamondOrnament({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 110" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M18 2 L34 19 L18 36 L2 19 Z" />
      <path d="M18 37 L34 54 L18 71 L2 54 Z" />
      <path d="M18 72 L34 89 L18 106 L2 89 Z" />
    </svg>
  );
}

const inputClass =
  "h-[clamp(2.875rem,3.1vw,3.75rem)] w-full rounded-[8px] border border-[var(--g7-teal-900)]/25 bg-[var(--g7-white)] px-[clamp(0.875rem,1vw,1.25rem)] text-[clamp(1rem,1.04vw,1.25rem)] text-[var(--g7-teal-900)] placeholder:text-[var(--g7-muted)]/75 transition-colors focus:border-[var(--g7-gold-500)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--g7-gold-500)]/40 aria-[invalid=true]:border-red-700";
function SelectBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown size={18} aria-hidden="true" className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-[var(--g7-muted)]" />
    </div>
  );
}

const labelClass = "g7-t24 mb-[clamp(0.5rem,0.9vw,1.1rem)] block font-normal text-[var(--g7-teal-900)]";

/* 09 -- Quote form + CTA image (split). Image is the inline-start ~60%, the form panel the rest. */
export function G7QuoteRender({ data, locale, interactive }: BlockRenderProps<G7QuoteData>) {
  const t = locale === "ar" ? MESSAGES.ar : MESSAGES.en;
  const [state, formAction, pending, submitKeepingInput] = useFormAction(submitQuoteRequestAction, initialState);
  const [errors, setErrors] = useState<FieldErrors>({});
  // The success panel shows for the latest successful result until the visitor asks for a new form.
  const [dismissed, setDismissed] = useState<LeadFormState | null>(null);
  const done = Boolean(state.success) && dismissed !== state;
  const statusRef = useRef<HTMLDivElement>(null);
  const anchorId = data.anchorId || undefined;

  useEffect(() => {
    if (state.success || state.error) statusRef.current?.focus();
  }, [state]);

  function validate(form: HTMLFormElement): FieldErrors {
    const value = (name: string) => String(new FormData(form).get(name) ?? "").trim();
    const next: FieldErrors = {};
    if (!value("contactName")) next.contactName = t.nameRequired;
    const phone = value("phone");
    if (!phone) next.phone = t.phoneRequired;
    else if (!/^[+\d][\d\s()-]{6,}$/.test(phone.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))))) next.phone = t.phoneInvalid;
    return next;
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    const next = validate(event.currentTarget);
    setErrors(next);
    if (Object.keys(next).length > 0) {
      event.preventDefault();
      const first = Object.keys(next)[0];
      event.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    submitKeepingInput(event);
  }

  const fieldError = (name: keyof FieldErrors) =>
    errors[name] ? (
      <p id={`g7q-${name}-error`} className="mt-1.5 text-sm text-red-800">
        {errors[name]}
      </p>
    ) : null;

  return (
    <section id={anchorId} className="scroll-mt-24 bg-[var(--g7-cream-50)]">
      <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr]">
        {/* Image + overlaid heading */}
        <div className="relative aspect-[4/5] overflow-hidden bg-[var(--g7-teal-900)] sm:aspect-[5/4] xl:aspect-auto xl:min-h-[47.9vw]">
          {data.image?.url ? <Image src={data.image.url} alt={data.imageAlt ?? ""} fill sizes="(min-width: 1280px) 60vw, 100vw" className="object-cover object-bottom" /> : null}
          <DiamondOrnament className="absolute start-[clamp(1.25rem,2.9vw,3.5rem)] top-[clamp(1.25rem,2.1vw,2.5rem)] h-[clamp(4rem,6.5vw,7.8rem)] w-[clamp(1.25rem,2vw,2.4rem)] text-[var(--g7-gold-500)]" />
          <div className="relative px-6 pt-[clamp(3rem,4.6vw,5.5rem)] text-center text-[var(--g7-cream-50)]">
            <h2 className="text-[clamp(2rem,4vw,4.8rem)] font-bold leading-[1.2] ltr:text-[clamp(1.75rem,3vw,3.6rem)]">
              {data.asideHeadingLine1}
              {data.asideHeadingLine2 ? (
                <>
                  <br />
                  {data.asideHeadingLine2}
                </>
              ) : null}
            </h2>
            {data.asideSubtitle ? <p className="mt-[clamp(0.75rem,1.6vw,1.9rem)] text-[clamp(1.0625rem,1.67vw,2rem)] font-light">{data.asideSubtitle}</p> : null}
          </div>
        </div>

        {/* Form panel */}
        <div className="px-4 py-12 sm:px-10 xl:px-[clamp(2rem,2.9vw,3.5rem)] xl:pb-[clamp(2rem,2.6vw,3.1rem)] xl:pt-[clamp(2.5rem,4.2vw,5rem)]">
          <div className="mx-auto max-w-[40rem] xl:max-w-none">
            {data.eyebrow ? <p className={cn(g7Eyebrow, "g7-t22")}>{data.eyebrow}</p> : null}
            {data.heading ? <h2 className="mt-[clamp(1rem,2vw,2.4rem)] text-[clamp(2.25rem,3.75vw,4.5rem)] font-bold leading-[1.2] text-[var(--g7-teal-900)]">{data.heading}</h2> : null}
            {data.subtitle ? <p className="mt-[clamp(1rem,2.2vw,2.6rem)] text-[clamp(1.125rem,1.77vw,2.125rem)] font-bold text-[var(--g7-teal-900)]">{data.subtitle}</p> : null}

            <div ref={statusRef} tabIndex={-1} role="status" aria-live="polite" className="outline-none">
              {done ? (
                <div className="mt-8 rounded-[12px] border border-[var(--g7-teal-900)]/20 bg-[var(--g7-white)] p-6 text-[var(--g7-teal-900)]">
                  <CheckCircle2 className="text-[var(--g7-gold-500)]" size={28} aria-hidden="true" />
                  <p className="mt-3 text-lg font-medium">{t.success}</p>
                  <button type="button" onClick={() => setDismissed(state)} className="mt-4 text-sm font-medium underline underline-offset-4">
                    {t.another}
                  </button>
                </div>
              ) : state.error ? (
                <p className="mt-6 rounded-[8px] border border-red-800/30 bg-red-50 px-4 py-3 text-sm text-red-900">{state.error}</p>
              ) : null}
            </div>

            {!done ? (
              <form action={interactive ? formAction : undefined} onSubmit={interactive ? onSubmit : (e) => e.preventDefault()} noValidate className="mt-[clamp(1.75rem,3.4vw,4.1rem)] grid grid-cols-1 gap-x-[clamp(1rem,1.9vw,2.3rem)] gap-y-[clamp(1.25rem,1.9vw,2.3rem)] sm:grid-cols-2">
                <input type="hidden" name="locale" value={locale.toUpperCase()} />
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="g7q-website">{t.honeypot}</label>
                  <input id="g7q-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
                </div>

                <div>
                  <label htmlFor="g7q-name" className={labelClass}>{data.nameLabel}</label>
                  <input id="g7q-name" name="contactName" autoComplete="name" placeholder={data.namePlaceholder} className={inputClass} aria-invalid={Boolean(errors.contactName)} aria-describedby={errors.contactName ? "g7q-contactName-error" : undefined} />
                  {fieldError("contactName")}
                </div>
                <div>
                  <label htmlFor="g7q-company" className={labelClass}>{data.companyLabel}</label>
                  <input id="g7q-company" name="companyName" autoComplete="organization" placeholder={data.companyPlaceholder} className={inputClass} />
                </div>

                <div>
                  <label htmlFor="g7q-city" className={labelClass}>{data.cityLabel}</label>
                  <SelectBox>
                    <select id="g7q-city" name="city" defaultValue="" className={cn(inputClass, "appearance-none pe-11")}>
                    <option value="">{data.cityPlaceholder}</option>
                    {(data.cities ?? []).map((c) => (
                      <option key={c.value} value={c.label}>{c.label}</option>
                    ))}
                  </select>
                  </SelectBox>
                </div>
                <div>
                  <label htmlFor="g7q-phone" className={labelClass}>{data.phoneLabel}</label>
                  <input id="g7q-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" placeholder={data.phonePlaceholder} className={cn(inputClass, "rtl:text-right")} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "g7q-phone-error" : undefined} />
                  {fieldError("phone")}
                </div>

                <fieldset>
                  <legend className={labelClass}>{data.productsLabel}</legend>
                  <div className="flex flex-wrap gap-2.5">
                    {(data.products ?? []).map((p) => (
                      <label key={p.value} className="cursor-pointer">
                        <input type="checkbox" name="products" value={p.label} className="peer sr-only" />
                        <span className="inline-flex h-[clamp(2.875rem,2.7vw,3.25rem)] items-center rounded-full border border-[var(--g7-teal-900)]/25 bg-[var(--g7-white)] px-[clamp(1rem,1.1vw,1.3rem)] text-[clamp(1rem,1.15vw,1.375rem)] text-[var(--g7-teal-900)] transition-colors hover:border-[var(--g7-gold-500)] peer-checked:border-[var(--g7-teal-900)] peer-checked:bg-[var(--g7-teal-900)] peer-checked:text-[var(--g7-cream-50)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--g7-gold-500)]">
                          {p.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div>
                  <label htmlFor="g7q-quantity" className={labelClass}>{data.quantityLabel}</label>
                  <SelectBox>
                    <select id="g7q-quantity" name="quantity" defaultValue="" className={cn(inputClass, "appearance-none pe-11")}>
                    <option value="">{data.quantityPlaceholder}</option>
                    {(data.quantities ?? []).map((q) => (
                      <option key={q.value} value={q.label}>{q.label}</option>
                    ))}
                  </select>
                  </SelectBox>
                </div>

                <div className="sm:col-span-2">
                  <button type="submit" disabled={pending || !interactive} className={cn(g7GoldButton, "mt-[clamp(0.5rem,1.4vw,1.7rem)] min-h-[clamp(3.5rem,4.4vw,5.3rem)] w-full rounded-[8px] text-[clamp(1.25rem,1.875vw,2.25rem)] disabled:opacity-70")}>
                    {pending ? <Loader2 size={20} className="animate-spin" aria-hidden="true" /> : null}
                    {pending ? t.sending : data.submitLabel}
                    {!pending ? <G7Arrow size={20} /> : null}
                  </button>
                  {data.note ? <p className="mt-[clamp(1.25rem,2.2vw,2.6rem)] text-center text-[clamp(0.9375rem,1.04vw,1.25rem)] font-light text-[var(--g7-muted)]">{data.note}</p> : null}
                </div>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function OptionsEditor({ label, items, onChange, dir }: { label: string; items: G7Option[]; onChange: (next: G7Option[]) => void; dir: "rtl" | "ltr" }) {
  return (
    <G7ListEditor<G7Option>
      label={label}
      items={items}
      max={30}
      onChange={onChange}
      createItem={() => ({ value: `opt-${Date.now().toString(36)}`, label: "" })}
      itemLabel={(item) => item.label ?? item.value}
      renderItem={(item, update) => <TextField label="Label" value={item.label ?? ""} onChange={(label) => update({ ...item, label })} dir={dir} />}
    />
  );
}

export function G7QuoteEdit({ data, onChange, locale }: BlockEditProps<G7QuoteData>) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const set = <K extends keyof G7QuoteData>(key: K) => (value: G7QuoteData[K]) => onChange({ ...data, [key]: value });
  const pairs: [keyof G7QuoteData, string][] = [
    ["nameLabel", "Name label"],
    ["namePlaceholder", "Name placeholder"],
    ["companyLabel", "Business label"],
    ["companyPlaceholder", "Business placeholder"],
    ["cityLabel", "City label"],
    ["cityPlaceholder", "City placeholder"],
    ["phoneLabel", "Phone label"],
    ["phonePlaceholder", "Phone placeholder"],
    ["productsLabel", "Products label"],
    ["quantityLabel", "Quantity label"],
    ["quantityPlaceholder", "Quantity placeholder"],
    ["submitLabel", "Submit button"],
  ];
  return (
    <div className="space-y-3">
      <TextField label="Anchor id (links use #id)" value={data.anchorId ?? ""} onChange={(v) => set("anchorId")(v.replace(/[^a-zA-Z0-9_-]/g, ""))} />
      <G7ImageField label="Image" value={data.image} onChange={set("image")} />
      <TextField label="Image alt text" value={data.imageAlt ?? ""} onChange={set("imageAlt")} dir={dir} />
      <TextField label="Image heading line 1" value={data.asideHeadingLine1 ?? ""} onChange={set("asideHeadingLine1")} dir={dir} />
      <TextField label="Image heading line 2" value={data.asideHeadingLine2 ?? ""} onChange={set("asideHeadingLine2")} dir={dir} />
      <TextField label="Image subtitle" value={data.asideSubtitle ?? ""} onChange={set("asideSubtitle")} dir={dir} />
      <TextField label="Form eyebrow" value={data.eyebrow ?? ""} onChange={set("eyebrow")} dir={dir} />
      <TextField label="Form heading" value={data.heading ?? ""} onChange={set("heading")} dir={dir} />
      <TextField label="Form subtitle" value={data.subtitle ?? ""} onChange={set("subtitle")} dir={dir} />
      <div className="grid grid-cols-2 gap-3">
        {pairs.map(([key, label]) => (
          <TextField key={key} label={label} value={(data[key] as string) ?? ""} onChange={(v) => onChange({ ...data, [key]: v })} dir={dir} />
        ))}
      </div>
      <OptionsEditor label="Cities" items={data.cities ?? []} onChange={set("cities")} dir={dir} />
      <OptionsEditor label="Products" items={data.products ?? []} onChange={set("products")} dir={dir} />
      <OptionsEditor label="Quantities" items={data.quantities ?? []} onChange={set("quantities")} dir={dir} />
      <TextField label="Note under the button" value={data.note ?? ""} onChange={set("note")} dir={dir} />
    </div>
  );
}
