"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { SelectField, TextField, styledProps } from "@/components/admin/ui/field";
import { useFormAction } from "@/lib/use-form-action";
import { cn } from "@/lib/cn";
import { StyledText } from "@/components/text/styled-text";
import { richOf } from "@/lib/text-style/rich-text";
import { submitQuoteRequestAction } from "@/app/[locale]/page-builder-lead-action";
import type { LeadFormState } from "@/lib/leads/submit-lead";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import type { G7Option, G7QuoteData } from "./schema";
import type { QuoteCatalogItem } from "./resolve";
import { G7Arrow, G7ImageField, G7ListEditor, G7PositionFields, g7Eyebrow, g7GoldButton, g7OffsetStyle, g7OverlayClasses } from "./shared";

const initialState: LeadFormState = {};

const MESSAGES = {
  ar: {
    nameRequired: "يرجى إدخال اسمك.",
    phoneRequired: "يرجى إدخال رقم التواصل.",
    phoneInvalid: "يرجى إدخال رقم تواصل صحيح.",
    cityOtherRequired: "يرجى كتابة اسم المدينة.",
    sending: "جارٍ الإرسال…",
    success: "شكرًا لك! استلمنا طلبك وسنتواصل معك قريبًا.",
    another: "إرسال طلب آخر",
    honeypot: "اترك هذا الحقل فارغًا",
  },
  en: {
    nameRequired: "Please enter your name.",
    phoneRequired: "Please enter your phone number.",
    phoneInvalid: "Please enter a valid phone number.",
    cityOtherRequired: "Please enter the city name.",
    sending: "Sending…",
    success: "Thank you! We've received your request and will be in touch soon.",
    another: "Send another request",
    honeypot: "Leave this field empty",
  },
};

type FieldErrors = Partial<Record<"contactName" | "phone" | "cityOther", string>>;

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
  "h-[clamp(2.875rem,3.1vw,3.75rem)] w-full rounded-[8px] border border-[var(--g7-teal-900)]/25 bg-[var(--g7-white)] px-[clamp(0.875rem,1vw,1.25rem)] t-ui text-[var(--g7-teal-900)] placeholder:text-[var(--g7-muted)]/75 transition-colors focus:border-[var(--g7-gold-500)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--g7-gold-500)]/40 aria-[invalid=true]:border-red-700";
function SelectBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown size={18} aria-hidden="true" className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-[var(--g7-muted)]" />
    </div>
  );
}

const labelClass = "t-ui mb-[clamp(0.5rem,0.9vw,1.1rem)] block font-medium text-[var(--g7-teal-900)]";
/** Sticky header height (header.tsx) + breathing room, so in-page jumps never hide the heading. */
const anchorOffset = "scroll-mt-[calc(clamp(4.5rem,7.3vw,8.75rem)+1rem)]";

const isOtherCity = (o: G7Option) => o.value === "other" || /أخرى|other/i.test(o.label ?? "");

const pillClass =
  "t-ui flex h-[clamp(2.875rem,2.7vw,3.25rem)] w-full items-center justify-center truncate rounded-full border border-[var(--g7-teal-900)]/25 bg-[var(--g7-white)] px-2 text-[var(--g7-teal-900)] transition-colors hover:border-[var(--g7-gold-500)] peer-checked:border-[var(--g7-teal-900)] peer-checked:bg-[var(--g7-teal-900)] peer-checked:text-[var(--g7-cream-50)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--g7-gold-500)]";

/**
 * «المنتجات المطلوبة» from the catalog: one pill per published product (several can be picked); a
 * picked product with variants shows an optional variant select («أبشر — ٧ مم»). Submits
 * `productSlugs` + `variant.<slug>` = variant id; the action turns them into readable lead lines.
 * `?product=<slug>&variant=<id>` (the product page's «اطلب عرض سعر لهذا المنتج») preselects both.
 */
function CatalogPicker({ legend, catalog, locale }: { legend: string; catalog: QuoteCatalogItem[]; locale: string }) {
  // Pages hosting this block render per request, so the query is known on the server too (no flash).
  const searchParams = useSearchParams();
  const [picked, setPicked] = useState<Record<string, string>>(() => {
    const slug = searchParams.get("product");
    const item = slug ? catalog.find((c) => c.slug === slug) : undefined;
    if (!item) return {};
    const variant = searchParams.get("variant");
    return { [item.slug]: item.variants.some((v) => v.id === variant) ? variant! : "" };
  });

  const anyVariant = locale === "ar" ? "أي نوع" : "Any variant";
  const withVariants = catalog.filter((c) => c.slug in picked && c.variants.length > 0);

  return (
    <fieldset className="sm:col-span-2" data-quote-catalog>
      <legend className={labelClass}>{legend}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {catalog.map((item) => (
          <label key={item.slug} className="min-w-0 cursor-pointer" title={item.label}>
            <input
              type="checkbox"
              name="productSlugs"
              value={item.slug}
              checked={item.slug in picked}
              onChange={(e) =>
                setPicked((p) => {
                  const next = { ...p };
                  if (e.target.checked) next[item.slug] = "";
                  else delete next[item.slug];
                  return next;
                })
              }
              className="peer sr-only"
            />
            <span className={pillClass}>{item.label}</span>
          </label>
        ))}
      </div>
      {withVariants.length > 0 ? (
        <div className="mt-3 space-y-2">
          {withVariants.map((item) => (
            <div key={item.slug} className="flex flex-wrap items-center gap-2">
              <label htmlFor={`g7q-variant-${item.slug}`} className="t-ui min-w-0 flex-1 truncate text-[var(--g7-teal-900)]">
                {item.label}
              </label>
              <SelectBox>
                <select
                  id={`g7q-variant-${item.slug}`}
                  name={`variant.${item.slug}`}
                  value={picked[item.slug] ?? ""}
                  onChange={(e) => setPicked((p) => ({ ...p, [item.slug]: e.target.value }))}
                  className={cn(inputClass, "w-auto min-w-[12rem] appearance-none pe-11")}
                >
                  <option value="">{anyVariant}</option>
                  {item.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </SelectBox>
            </div>
          ))}
        </div>
      ) : null}
    </fieldset>
  );
}

/* 09 -- Quote form + CTA image (split). Image is the inline-start ~60%, the form panel the rest. */
export function G7QuoteRender({ data, locale, interactive }: BlockRenderProps<G7QuoteData>) {
  const t = locale === "ar" ? MESSAGES.ar : MESSAGES.en;
  // Catalog pills (resolveG7Quote, while variants are enabled); otherwise the typed `products` pills.
  const catalog = (data as G7QuoteData & { catalog?: QuoteCatalogItem[] }).catalog ?? [];
  const [state, formAction, pending, submitKeepingInput] = useFormAction(submitQuoteRequestAction, initialState);
  const [errors, setErrors] = useState<FieldErrors>({});
  // The success panel shows for the latest successful result until the visitor asks for a new form.
  const [dismissed, setDismissed] = useState<LeadFormState | null>(null);
  const done = Boolean(state.success) && dismissed !== state;
  const statusRef = useRef<HTMLDivElement>(null);
  const anchorId = data.anchorId || "quote";
  // "Other city": a required free-text city field appears under the select (finding 12).
  const otherCityLabel = (data.cities ?? []).find(isOtherCity)?.label ?? null;
  const [otherCity, setOtherCity] = useState(false);

  useEffect(() => {
    if (state.success || state.error) statusRef.current?.focus();
  }, [state]);

  function validate(form: HTMLFormElement): FieldErrors {
    const value = (name: string) => String(new FormData(form).get(name) ?? "").trim();
    const next: FieldErrors = {};
    if (!value("contactName")) next.contactName = t.nameRequired;
    if (otherCity && !value("cityOther")) next.cityOther = t.cityOtherRequired;
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
    <section className="bg-[var(--g7-cream-50)]">
      <div className={cn("grid grid-cols-1", data.formSide === "start" ? "xl:grid-cols-[2fr_3fr]" : "xl:grid-cols-[3fr_2fr]")}>
        {/* Image + overlaid heading */}
        <div className="relative aspect-[4/5] overflow-hidden bg-[var(--g7-teal-900)] sm:aspect-[5/4] xl:aspect-auto xl:min-h-[47.9vw]">
          {data.image?.url ? <Image src={data.image.url} alt={data.imageAlt ?? ""} fill sizes="(min-width: 1280px) 60vw, 100vw" className="object-cover object-bottom" /> : null}
          <DiamondOrnament className="absolute start-[clamp(1.25rem,2.9vw,3.5rem)] top-[clamp(1.25rem,2.1vw,2.5rem)] h-[clamp(4rem,6.5vw,7.8rem)] w-[clamp(1.25rem,2vw,2.4rem)] text-[var(--g7-gold-500)]" />
          <div dir="ltr" className={cn("absolute inset-0 flex px-[clamp(1.5rem,4vw,5rem)] pb-[clamp(3rem,4.6vw,5.5rem)] pt-[clamp(2.5rem,9vw,9rem)] text-[var(--g7-cream-50)]", g7OverlayClasses(data.asideTextX, data.asideTextY, "base", locale))}>
            <div dir={locale === "ar" ? "rtl" : "ltr"} className="g7-nudge" style={g7OffsetStyle(data.asideOffsetX, data.asideOffsetY)}>
            <h2 className="t-h2">
              <StyledText text={data.asideHeadingLine1} rich={richOf(data, "asideHeadingLine1")} />
              {data.asideHeadingLine2 ? (
                <>
                  <br />
                  <StyledText text={data.asideHeadingLine2} rich={richOf(data, "asideHeadingLine2")} />
                </>
              ) : null}
            </h2>
            {data.asideSubtitle ? <p className="t-h3 mt-[clamp(0.75rem,1.4vw,1.6rem)] font-light"><StyledText text={data.asideSubtitle} rich={richOf(data, "asideSubtitle")} /></p> : null}
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div id={anchorId} className={cn(anchorOffset, data.formSide === "start" && "xl:order-first", "px-4 py-12 sm:px-10 xl:px-[clamp(2rem,2.9vw,3.5rem)] xl:pb-[clamp(2rem,2.6vw,3.1rem)] xl:pt-[clamp(2.5rem,4.2vw,5rem)]")}>
          <div className="mx-auto max-w-[40rem] xl:max-w-none">
            {data.eyebrow ? <p className={g7Eyebrow}><StyledText text={data.eyebrow} rich={richOf(data, "eyebrow")} /></p> : null}
            {data.heading ? <h2 id={anchorId === "quote-form" ? undefined : "quote-form"} className={cn(anchorOffset, "t-h2 mt-[clamp(0.75rem,1.4vw,1.6rem)] text-[var(--g7-teal-900)]")}><StyledText text={data.heading} rich={richOf(data, "heading")} /></h2> : null}
            {data.subtitle ? <p className="t-h3 mt-[clamp(0.75rem,1.6vw,1.9rem)] text-[var(--g7-teal-900)]"><StyledText text={data.subtitle} rich={richOf(data, "subtitle")} /></p> : null}

            <div ref={statusRef} tabIndex={-1} role="status" aria-live="polite" className="outline-none">
              {done ? (
                <div className="mt-8 rounded-[12px] border border-[var(--g7-teal-900)]/20 bg-[var(--g7-white)] p-6 text-[var(--g7-teal-900)]">
                  <CheckCircle2 className="text-[var(--g7-gold-500)]" size={28} aria-hidden="true" />
                  <p className="t-p mt-3 font-medium">{t.success}</p>
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
                  <label htmlFor="g7q-name" className={labelClass}><StyledText text={data.nameLabel} rich={richOf(data, "nameLabel")} /></label>
                  <input id="g7q-name" name="contactName" autoComplete="name" placeholder={data.namePlaceholder} className={inputClass} aria-invalid={Boolean(errors.contactName)} aria-describedby={errors.contactName ? "g7q-contactName-error" : undefined} />
                  {fieldError("contactName")}
                </div>
                <div>
                  <label htmlFor="g7q-company" className={labelClass}><StyledText text={data.companyLabel} rich={richOf(data, "companyLabel")} /></label>
                  <input id="g7q-company" name="companyName" autoComplete="organization" placeholder={data.companyPlaceholder} className={inputClass} />
                </div>

                <div>
                  <label htmlFor="g7q-city" className={labelClass}><StyledText text={data.cityLabel} rich={richOf(data, "cityLabel")} /></label>
                  <SelectBox>
                    <select id="g7q-city" name="city" defaultValue="" onChange={(e) => setOtherCity(Boolean(otherCityLabel) && e.target.value === otherCityLabel)} className={cn(inputClass, "appearance-none pe-11")}>
                    <option value="">{data.cityPlaceholder}</option>
                    {(data.cities ?? []).map((c) => (
                      <option key={c.value} value={c.label}>{c.label}</option>
                    ))}
                  </select>
                  </SelectBox>
                  {otherCity ? (
                    <div className="mt-3">
                      <label htmlFor="g7q-city-other" className="sr-only">{data.otherCityLabel || t.cityOtherRequired}</label>
                      <input
                        id="g7q-city-other"
                        name="cityOther"
                        required
                        autoComplete="address-level2"
                        placeholder={data.otherCityLabel || ""}
                        className={inputClass}
                        aria-invalid={Boolean(errors.cityOther)}
                        aria-describedby={errors.cityOther ? "g7q-cityOther-error" : undefined}
                      />
                      {fieldError("cityOther")}
                    </div>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="g7q-phone" className={labelClass}><StyledText text={data.phoneLabel} rich={richOf(data, "phoneLabel")} /></label>
                  <input id="g7q-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" placeholder={data.phonePlaceholder} className={cn(inputClass, "rtl:text-right")} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "g7q-phone-error" : undefined} />
                  {fieldError("phone")}
                </div>

                {catalog.length > 0 ? (
                  <CatalogPicker legend={data.productsLabel ?? ""} catalog={catalog} locale={locale} />
                ) : (
                <fieldset>
                  <legend className={labelClass}><StyledText text={data.productsLabel} rich={richOf(data, "productsLabel")} /></legend>
                  {/* One even row of pills -- never a single orphan pill on its own line (finding 09). */}
                  <div className="grid grid-cols-3 gap-2">
                    {(data.products ?? []).map((p) => (
                      <label key={p.value} className="min-w-0 cursor-pointer">
                        <input type="checkbox" name="products" value={p.label} className="peer sr-only" />
                        <span className={pillClass}>
                          {p.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                )}
                <div>
                  <label htmlFor="g7q-quantity" className={labelClass}><StyledText text={data.quantityLabel} rich={richOf(data, "quantityLabel")} /></label>
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
                  <button type="submit" disabled={pending || !interactive} className={cn(g7GoldButton, "mt-[clamp(0.5rem,1.4vw,1.7rem)] min-h-[clamp(3.5rem,4.4vw,5.3rem)] w-full rounded-[8px] disabled:opacity-70")}>
                    {pending ? <Loader2 size={20} className="animate-spin" aria-hidden="true" /> : null}
                    {pending ? t.sending : <StyledText text={data.submitLabel} rich={richOf(data, "submitLabel")} />}
                    {!pending ? <G7Arrow size={20} /> : null}
                  </button>
                  {data.note ? <p className="t-small mt-[clamp(1rem,1.8vw,2.2rem)] text-center font-light text-[var(--g7-muted)]"><StyledText text={data.note} rich={richOf(data, "note")} /></p> : null}
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
      renderItem={(item, update) => <TextField label="Label" {...styledProps(item, "label", update)} dir={dir} />}
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
    ["otherCityLabel", "Other-city field placeholder"],
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
      <TextField label="Image heading line 1" {...styledProps(data, "asideHeadingLine1", onChange)} dir={dir} />
      <TextField label="Image heading line 2" {...styledProps(data, "asideHeadingLine2", onChange)} dir={dir} />
      <TextField label="Image subtitle" {...styledProps(data, "asideSubtitle", onChange)} dir={dir} />
      <G7PositionFields
        label="Image text position"
        x={data.asideTextX}
        y={data.asideTextY}
        offsetX={data.asideOffsetX}
        offsetY={data.asideOffsetY}
        onChange={(p) => onChange({ ...data, asideTextX: p.x, asideTextY: p.y, asideOffsetX: p.offsetX, asideOffsetY: p.offsetY })}
      />
      <SelectField
        label="موضع النموذج · Form position (wide screens)"
        value={data.formSide ?? "end"}
        onChange={(formSide) => onChange({ ...data, formSide })}
        options={[
          { value: "end", label: "نهاية السطر · End (left in AR, right in EN)" },
          { value: "start", label: "بداية السطر · Start (right in AR, left in EN)" },
        ]}
      />
      <TextField label="Form eyebrow" {...styledProps(data, "eyebrow", onChange)} dir={dir} />
      <TextField label="Form heading" {...styledProps(data, "heading", onChange)} dir={dir} />
      <TextField label="Form subtitle" {...styledProps(data, "subtitle", onChange)} dir={dir} />
      <div className="grid grid-cols-2 gap-3">
        {pairs.map(([key, label]) => (
          // Placeholders stay plain text (an input placeholder can't carry styling); labels/button are styled.
          String(key).includes("Placeholder") ? (
            <TextField key={key} label={label} value={(data[key] as string) ?? ""} onChange={(v) => onChange({ ...data, [key]: v })} dir={dir} />
          ) : (
            <TextField key={key} label={label} {...styledProps(data, key as keyof G7QuoteData & string, onChange)} dir={dir} />
          )
        ))}
      </div>
      <OptionsEditor label="Cities" items={data.cities ?? []} onChange={set("cities")} dir={dir} />
      <OptionsEditor label="Products" items={data.products ?? []} onChange={set("products")} dir={dir} />
      <OptionsEditor label="Quantities" items={data.quantities ?? []} onChange={set("quantities")} dir={dir} />
      <TextField label="Note under the button" {...styledProps(data, "note", onChange)} dir={dir} />
    </div>
  );
}
