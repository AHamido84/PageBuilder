"use client";

import { useActionState, useState } from "react";
import { MediaPickerField } from "@/components/admin/ui/media-picker-field";
import type { HeaderLogoSettings, HeaderLogoLocaleSettings } from "@/lib/site-settings/header-logo";
import type { DesignTokens } from "@/lib/design-tokens/schema";
import { ENGLISH_FONT_OPTIONS, ARABIC_FONT_OPTIONS, SHADOW_OPTIONS, ANIMATION_DEFAULT_OPTIONS } from "@/lib/design-tokens/schema";
import {
  updateGeneralSettingsAction,
  updateContactSettingsAction,
  updateSocialSettingsAction,
  updateHoursSettingsAction,
  updateSeoSettingsAction,
  updateFooterSettingsAction,
  updateDesignTokensAction,
  type FormActionState,
} from "./actions";

const initialState: FormActionState = {};
const inputClass = "w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm";

function SaveButton({ pending }: { pending: boolean }) {
  return (
    <button type="submit" disabled={pending} className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-60">
      {pending ? "Saving..." : "Save"}
    </button>
  );
}

function StatusLine({ state }: { state: FormActionState }) {
  if (state.error) return <p className="col-span-full text-sm text-red-400">{state.error}</p>;
  if (state.success) return <p className="col-span-full text-sm text-emerald-400">Saved.</p>;
  return null;
}

export interface Settings {
  siteNameEn: string;
  siteNameAr: string;
  logoId: string | null;
  logo: { url: string } | null;
  headerLogo: HeaderLogoSettings;
  faviconId: string | null;
  favicon: { url: string } | null;
  contactEmail: string | null;
  contactPhone: string | null;
  whatsapp: string | null;
  address: string | null;
  mapEmbedUrl: string | null;
  socialLinks: { facebook?: string; instagram?: string; linkedin?: string; twitter?: string } | null;
  businessHours: Record<string, string> | null;
  seoDefaultTitleEn: string | null;
  seoDefaultTitleAr: string | null;
  seoDefaultDescriptionEn: string | null;
  seoDefaultDescriptionAr: string | null;
  analyticsId: string | null;
  gtmId: string | null;
  metaPixelId: string | null;
  defaultOgImageId: string | null;
  defaultOgImage: { url: string } | null;
  footerAboutEn: string | null;
  footerAboutAr: string | null;
  newsletterTitleEn: string | null;
  newsletterTitleAr: string | null;
  newsletterBodyEn: string | null;
  newsletterBodyAr: string | null;
  designTokens: DesignTokens;
}

/** Text input for a color override -- deliberately plain text, not `type="color"` (which can never
 * represent "empty/unset", only an actual color), so leaving it blank genuinely means "inherit the
 * current default", matching every other optional field in this form. The placeholder shows that
 * default so an admin can see what they're overriding. */
function ColorField({ name, label, placeholder, defaultValue }: { name: string; label: string; placeholder: string; defaultValue?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-neutral-400">{label}</label>
      <div className="flex items-center gap-2">
        <input name={name} defaultValue={defaultValue ?? ""} placeholder={placeholder} className={inputClass} />
        <span className="h-6 w-6 shrink-0 rounded border border-neutral-700" style={{ background: defaultValue || placeholder.split(" ")[0] }} aria-hidden />
      </div>
    </div>
  );
}

function NumField({ name, label, placeholder, defaultValue, step }: { name: string; label: string; placeholder: string; defaultValue?: number; step?: number }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-neutral-400">{label}</label>
      <input type="number" step={step ?? "any"} name={name} defaultValue={defaultValue ?? ""} placeholder={placeholder} className={inputClass} />
    </div>
  );
}

/** Tri-state select (Default / On / Off) -- see updateDesignTokensAction's optionalBoolean() for
 * why this isn't a checkbox: a plain HTML checkbox can't distinguish "not submitted" from
 * "explicitly unchecked", which would make "explicitly set to Off" indistinguishable from
 * "inherit". */
function TriStateField({ name, label, defaultValue }: { name: string; label: string; defaultValue?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-neutral-400">{label}</label>
      <select name={name} defaultValue={defaultValue === undefined ? "" : String(defaultValue)} className={inputClass}>
        <option value="">Default</option>
        <option value="true">On</option>
        <option value="false">Off</option>
      </select>
    </div>
  );
}

export function AppearanceForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState(updateDesignTokensAction, initialState);
  const t = settings.designTokens;
  const colors = t.colors ?? {};
  const typography = t.typography ?? {};
  const layout = t.layout ?? {};
  const buttons = t.buttons ?? {};
  const animation = t.animation ?? {};
  const responsive = t.responsive ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <p className="text-xs text-neutral-500">
        Every field below is optional. Leave one blank to keep the site&apos;s current default -- these become the site-wide DEFAULT; any Page Builder
        section can still override background, animation, padding, etc. on its own Style panel exactly as before.
      </p>

      <fieldset className="space-y-3">
        <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">Global colors</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ColorField name="colors.primary" label="Primary" placeholder="#ee665a (default)" defaultValue={colors.primary} />
          <ColorField name="colors.secondary" label="Secondary" placeholder="#07564e (default)" defaultValue={colors.secondary} />
          <ColorField name="colors.accent" label="Accent" placeholder="#0b806f (default)" defaultValue={colors.accent} />
          <ColorField name="colors.gold" label="Gold" placeholder="#d5b45c (default)" defaultValue={colors.gold} />
          <ColorField name="colors.background" label="Background" placeholder="#f7f8f5 (default)" defaultValue={colors.background} />
          <ColorField name="colors.surface" label="Surface" placeholder="#e6efec (default)" defaultValue={colors.surface} />
          <ColorField name="colors.text" label="Text" placeholder="#18302d (default)" defaultValue={colors.text} />
          <ColorField name="colors.mutedText" label="Muted text" placeholder="#18302d (60% opacity, default)" defaultValue={colors.mutedText} />
        </div>
      </fieldset>

      <fieldset className="space-y-3 border-t border-neutral-800 pt-4">
        <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">Typography</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-neutral-400">English font (body text)</label>
            <select name="typography.fontEn" defaultValue={typography.fontEn ?? ""} className={inputClass}>
              <option value="">Default (Public Sans)</option>
              {ENGLISH_FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-400">Arabic font</label>
            <select name="typography.fontAr" defaultValue={typography.fontAr ?? ""} className={inputClass}>
              <option value="">Default (IBM Plex Sans Arabic)</option>
              {ARABIC_FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-neutral-500">
          Sizes below are multipliers on the existing responsive scale (1 = today&apos;s size, 1.1 = 10% larger), not fixed pixel values -- this keeps
          each heading&apos;s mobile-to-desktop fluid scaling intact at any size.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <NumField name="typography.displaySize" label="Display size" placeholder="1" step={0.05} defaultValue={typography.displaySize} />
          <NumField name="typography.h1Size" label="H1 size" placeholder="1" step={0.05} defaultValue={typography.h1Size} />
          <NumField name="typography.h2Size" label="H2 size" placeholder="1" step={0.05} defaultValue={typography.h2Size} />
          <NumField name="typography.h3Size" label="H3 size" placeholder="1" step={0.05} defaultValue={typography.h3Size} />
          <NumField name="typography.bodySize" label="Body size" placeholder="1" step={0.05} defaultValue={typography.bodySize} />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NumField name="typography.weightHeading" label="Heading weight" placeholder="e.g. 700" step={100} defaultValue={typography.weightHeading} />
          <NumField name="typography.weightBody" label="Body weight" placeholder="e.g. 400" step={100} defaultValue={typography.weightBody} />
          <NumField name="typography.lineHeightScale" label="Line height (scale)" placeholder="1" step={0.05} defaultValue={typography.lineHeightScale} />
          <NumField name="typography.letterSpacingExtra" label="Letter spacing, extra (em)" placeholder="0" step={0.005} defaultValue={typography.letterSpacingExtra} />
        </div>
      </fieldset>

      <fieldset className="space-y-3 border-t border-neutral-800 pt-4">
        <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">Layout</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NumField name="layout.containerWidth" label="Container width (px)" placeholder="1400" defaultValue={layout.containerWidth} />
          <NumField name="layout.sectionSpacingScale" label="Section spacing (scale)" placeholder="1" step={0.05} defaultValue={layout.sectionSpacingScale} />
          <NumField name="layout.gridGap" label="Grid gap (rem)" placeholder="1.25" step={0.125} defaultValue={layout.gridGap} />
          <NumField name="layout.cardGap" label="Card gap (rem)" placeholder="1.5" step={0.125} defaultValue={layout.cardGap} />
          <NumField name="layout.buttonRadius" label="Button radius (rem)" placeholder="0.125" step={0.0625} defaultValue={layout.buttonRadius} />
          <NumField name="layout.cardRadius" label="Card radius (rem)" placeholder="0.25" step={0.0625} defaultValue={layout.cardRadius} />
          <NumField name="layout.imageRadius" label="Image radius (rem)" placeholder="0.25" step={0.0625} defaultValue={layout.imageRadius} />
        </div>
      </fieldset>

      <fieldset className="space-y-3 border-t border-neutral-800 pt-4">
        <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">Buttons (Gold / Ghost Gold / Primary / Secondary)</legend>
        <p className="text-xs text-neutral-500">
          Each variant&apos;s own color already comes from Global Colors above (Primary/Secondary/Gold) -- these controls are shared across all four.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NumField name="buttons.paddingScale" label="Padding (scale)" placeholder="1" step={0.05} defaultValue={buttons.paddingScale} />
          <NumField name="buttons.radius" label="Radius (rem)" placeholder="0.125" step={0.0625} defaultValue={buttons.radius} />
          <div>
            <label className="mb-1 block text-xs text-neutral-400">Shadow</label>
            <select name="buttons.shadow" defaultValue={buttons.shadow ?? ""} className={inputClass}>
              <option value="">Default (Flat)</option>
              {SHADOW_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <TriStateField name="buttons.showIcon" label="Icon" defaultValue={buttons.showIcon} />
        </div>
      </fieldset>

      <fieldset className="space-y-3 border-t border-neutral-800 pt-4">
        <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">Animation</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <TriStateField name="animation.enabled" label="Animation enabled" defaultValue={animation.enabled} />
          <TriStateField name="animation.scrollReveal" label="Scroll reveal" defaultValue={animation.scrollReveal} />
          <TriStateField name="animation.hoverAnimation" label="Hover animation" defaultValue={animation.hoverAnimation} />
          <TriStateField name="animation.pageTransition" label="Page transition" defaultValue={animation.pageTransition} />
          <NumField name="animation.speed" label="Speed (scale)" placeholder="1" step={0.1} defaultValue={animation.speed} />
          <div>
            <label className="mb-1 block text-xs text-neutral-400">Default animation</label>
            <select name="animation.defaultAnimation" defaultValue={animation.defaultAnimation ?? ""} className={inputClass}>
              <option value="">Default (Fade up)</option>
              {ANIMATION_DEFAULT_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-neutral-500">
          &quot;Default animation&quot; is what a section resolves to when its own Style panel Animation is set to &quot;Inherit from global default&quot;.
        </p>
      </fieldset>

      <fieldset className="space-y-3 border-t border-neutral-800 pt-4">
        <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">Responsive (per-breakpoint spacing overrides)</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 rounded-md border border-neutral-800 p-3">
            <p className="text-xs font-medium text-neutral-400">Tablet (&le; 1023px)</p>
            <NumField name="responsive.tablet.sectionSpacingScale" label="Section spacing (scale)" placeholder="inherit desktop" step={0.05} defaultValue={responsive.tablet?.sectionSpacingScale} />
            <NumField name="responsive.tablet.gridGap" label="Grid gap (rem)" placeholder="inherit desktop" step={0.125} defaultValue={responsive.tablet?.gridGap} />
            <NumField name="responsive.tablet.cardGap" label="Card gap (rem)" placeholder="inherit desktop" step={0.125} defaultValue={responsive.tablet?.cardGap} />
          </div>
          <div className="space-y-2 rounded-md border border-neutral-800 p-3">
            <p className="text-xs font-medium text-neutral-400">Mobile (&le; 639px)</p>
            <NumField name="responsive.mobile.sectionSpacingScale" label="Section spacing (scale)" placeholder="inherit tablet/desktop" step={0.05} defaultValue={responsive.mobile?.sectionSpacingScale} />
            <NumField name="responsive.mobile.gridGap" label="Grid gap (rem)" placeholder="inherit tablet/desktop" step={0.125} defaultValue={responsive.mobile?.gridGap} />
            <NumField name="responsive.mobile.cardGap" label="Card gap (rem)" placeholder="inherit tablet/desktop" step={0.125} defaultValue={responsive.mobile?.cardGap} />
          </div>
        </div>
      </fieldset>

      <StatusLine state={state} />
      <div>
        <SaveButton pending={pending} />
      </div>
    </form>
  );
}

/** One language's independent set of logo controls -- see src/lib/site-settings/header-logo.ts.
 * Field names are flattened as `headerLogo.<locale>.<field>` and reassembled server-side in
 * updateGeneralSettingsAction, since each language's box size/alignment/sticky/hide must be able to
 * diverge without touching the other (the exact bug class LocaleSectionSettings was already
 * introduced to fix for Page Builder sections). */
function LogoLocaleFields({ locale, value, dir }: { locale: "en" | "ar"; value: HeaderLogoLocaleSettings; dir: "ltr" | "rtl" }) {
  const n = (field: string) => `headerLogo.${locale}.${field}`;
  return (
    <div dir={dir} className="col-span-full grid grid-cols-1 gap-3 rounded-md border border-neutral-800 p-3 sm:grid-cols-2">
      <p className="col-span-full text-xs font-medium uppercase tracking-wide text-neutral-500">
        {locale === "en" ? "Logo — English" : "الشعار — عربي"}
      </p>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Height — desktop (px)</label>
        <input type="number" name={n("heightDesktop")} min={16} max={200} defaultValue={value.heightDesktop} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Height — mobile (px)</label>
        <input type="number" name={n("heightMobile")} min={16} max={200} defaultValue={value.heightMobile} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Width — desktop (px, blank = auto)</label>
        <input type="number" name={n("widthDesktop")} min={16} max={600} defaultValue={value.widthDesktop ?? ""} placeholder="Auto" className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Width — mobile (px, blank = auto)</label>
        <input type="number" name={n("widthMobile")} min={16} max={600} defaultValue={value.widthMobile ?? ""} placeholder="Auto" className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Maximum width (px, blank = no cap)</label>
        <input type="number" name={n("maxWidth")} min={16} max={600} defaultValue={value.maxWidth ?? ""} placeholder="None" className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Header spacing after logo (px)</label>
        <input type="number" name={n("spacing")} min={0} max={80} defaultValue={value.spacing} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Alignment within its box</label>
        <select name={n("align")} defaultValue={value.align} className={inputClass}>
          <option value="start">Start ({locale === "en" ? "left" : "right"})</option>
          <option value="center">Center</option>
          <option value="end">End ({locale === "en" ? "right" : "left"})</option>
        </select>
      </div>
      <div className="flex items-center gap-4 pt-5">
        <label className="flex items-center gap-1.5 text-xs text-neutral-300">
          <input type="checkbox" name={n("sticky")} value="true" defaultChecked={value.sticky} />
          Sticky header
        </label>
        <label className="flex items-center gap-1.5 text-xs text-neutral-300">
          <input type="checkbox" name={n("hidden")} value="true" defaultChecked={value.hidden} />
          Hide logo
        </label>
      </div>
    </div>
  );
}

export function GeneralForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState(updateGeneralSettingsAction, initialState);
  const [headerLogo] = useState(settings.headerLogo);
  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Company name (English)</label>
        <input name="siteNameEn" defaultValue={settings.siteNameEn} required className={inputClass} />
      </div>
      <div dir="rtl">
        <label className="mb-1 block text-xs text-neutral-400">اسم الشركة (عربي)</label>
        <input name="siteNameAr" defaultValue={settings.siteNameAr} required className={inputClass} />
      </div>
      <MediaPickerField name="logoId" label="Logo" accept="IMAGE" defaultMediaId={settings.logoId} defaultUrl={settings.logo?.url} />
      <MediaPickerField name="faviconId" label="Favicon" accept="IMAGE" defaultMediaId={settings.faviconId} defaultUrl={settings.favicon?.url} />
      <LogoLocaleFields locale="en" value={headerLogo.en} dir="ltr" />
      <LogoLocaleFields locale="ar" value={headerLogo.ar} dir="rtl" />
      <StatusLine state={state} />
      <div className="col-span-full">
        <SaveButton pending={pending} />
      </div>
    </form>
  );
}

export function ContactForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState(updateContactSettingsAction, initialState);
  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Email</label>
        <input name="contactEmail" type="email" defaultValue={settings.contactEmail ?? ""} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Phone</label>
        <input name="contactPhone" defaultValue={settings.contactPhone ?? ""} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">WhatsApp</label>
        <input name="whatsapp" defaultValue={settings.whatsapp ?? ""} placeholder="+9665XXXXXXXX" className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Map embed URL</label>
        <input name="mapEmbedUrl" defaultValue={settings.mapEmbedUrl ?? ""} placeholder="https://www.google.com/maps/embed?..." className={inputClass} />
      </div>
      <div className="col-span-full">
        <label className="mb-1 block text-xs text-neutral-400">Address</label>
        <textarea name="address" defaultValue={settings.address ?? ""} rows={2} className={inputClass} />
      </div>
      <StatusLine state={state} />
      <div className="col-span-full">
        <SaveButton pending={pending} />
      </div>
    </form>
  );
}

export function SocialForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState(updateSocialSettingsAction, initialState);
  const links = settings.socialLinks ?? {};
  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Facebook</label>
        <input name="facebook" defaultValue={links.facebook ?? ""} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Instagram</label>
        <input name="instagram" defaultValue={links.instagram ?? ""} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">LinkedIn</label>
        <input name="linkedin" defaultValue={links.linkedin ?? ""} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">X (Twitter)</label>
        <input name="twitter" defaultValue={links.twitter ?? ""} className={inputClass} />
      </div>
      <StatusLine state={state} />
      <div className="col-span-full">
        <SaveButton pending={pending} />
      </div>
    </form>
  );
}

const DAY_LABELS: [string, string][] = [
  ["sunday", "Sunday"],
  ["monday", "Monday"],
  ["tuesday", "Tuesday"],
  ["wednesday", "Wednesday"],
  ["thursday", "Thursday"],
  ["friday", "Friday"],
  ["saturday", "Saturday"],
];

export function HoursForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState(updateHoursSettingsAction, initialState);
  const hours = settings.businessHours ?? {};
  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {DAY_LABELS.map(([key, label]) => (
        <div key={key}>
          <label className="mb-1 block text-xs text-neutral-400">{label}</label>
          <input name={key} defaultValue={hours[key] ?? ""} placeholder="9:00 AM - 6:00 PM or Closed" className={inputClass} />
        </div>
      ))}
      <StatusLine state={state} />
      <div className="col-span-full">
        <SaveButton pending={pending} />
      </div>
    </form>
  );
}

export function SeoForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState(updateSeoSettingsAction, initialState);
  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Default SEO title (English)</label>
        <input name="seoDefaultTitleEn" defaultValue={settings.seoDefaultTitleEn ?? ""} className={inputClass} />
      </div>
      <div dir="rtl">
        <label className="mb-1 block text-xs text-neutral-400">عنوان السيو الافتراضي (عربي)</label>
        <input name="seoDefaultTitleAr" defaultValue={settings.seoDefaultTitleAr ?? ""} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Default meta description (English)</label>
        <textarea name="seoDefaultDescriptionEn" defaultValue={settings.seoDefaultDescriptionEn ?? ""} rows={2} className={inputClass} />
      </div>
      <div dir="rtl">
        <label className="mb-1 block text-xs text-neutral-400">وصف السيو الافتراضي (عربي)</label>
        <textarea name="seoDefaultDescriptionAr" defaultValue={settings.seoDefaultDescriptionAr ?? ""} rows={2} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Google Analytics 4 measurement ID</label>
        <input name="analyticsId" defaultValue={settings.analyticsId ?? ""} placeholder="G-XXXXXXXXXX" className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Google Tag Manager container ID</label>
        <input name="gtmId" defaultValue={settings.gtmId ?? ""} placeholder="GTM-XXXXXXX" className={inputClass} />
        <p className="mt-1 text-xs text-neutral-500">When set, GTM is used instead of loading gtag.js directly (fire GA4 through GTM to avoid double-counting).</p>
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Meta (Facebook) Pixel ID</label>
        <input name="metaPixelId" defaultValue={settings.metaPixelId ?? ""} placeholder="123456789012345" className={inputClass} />
      </div>
      <MediaPickerField name="defaultOgImageId" label="Default social share image" accept="IMAGE" defaultMediaId={settings.defaultOgImageId} defaultUrl={settings.defaultOgImage?.url} />
      <StatusLine state={state} />
      <div className="col-span-full">
        <SaveButton pending={pending} />
      </div>
    </form>
  );
}

export function FooterForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState(updateFooterSettingsAction, initialState);
  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Footer about text (English)</label>
        <textarea name="footerAboutEn" defaultValue={settings.footerAboutEn ?? ""} rows={3} className={inputClass} />
      </div>
      <div dir="rtl">
        <label className="mb-1 block text-xs text-neutral-400">نص الفوتر (عربي)</label>
        <textarea name="footerAboutAr" defaultValue={settings.footerAboutAr ?? ""} rows={3} className={inputClass} />
      </div>
      <div className="col-span-full border-t border-neutral-800 pt-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">Newsletter signup (blank uses the default)</p>
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Newsletter heading (English)</label>
        <input name="newsletterTitleEn" defaultValue={settings.newsletterTitleEn ?? ""} className={inputClass} />
      </div>
      <div dir="rtl">
        <label className="mb-1 block text-xs text-neutral-400">عنوان الاشتراك (عربي)</label>
        <input name="newsletterTitleAr" defaultValue={settings.newsletterTitleAr ?? ""} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Newsletter body (English)</label>
        <textarea name="newsletterBodyEn" defaultValue={settings.newsletterBodyEn ?? ""} rows={2} className={inputClass} />
      </div>
      <div dir="rtl">
        <label className="mb-1 block text-xs text-neutral-400">نص الاشتراك (عربي)</label>
        <textarea name="newsletterBodyAr" defaultValue={settings.newsletterBodyAr ?? ""} rows={2} className={inputClass} />
      </div>
      <StatusLine state={state} />
      <div className="col-span-full">
        <SaveButton pending={pending} />
      </div>
    </form>
  );
}
