"use client";

import { useActionState } from "react";
import { MediaPickerField } from "@/components/admin/ui/media-picker-field";
import {
  updateGeneralSettingsAction,
  updateContactSettingsAction,
  updateSocialSettingsAction,
  updateHoursSettingsAction,
  updateSeoSettingsAction,
  updateFooterSettingsAction,
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
  logoHeightDesktop: number | null;
  logoHeightMobile: number | null;
  logoAlign: "start" | "center" | "end" | null;
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
}

export function GeneralForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState(updateGeneralSettingsAction, initialState);
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
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Logo height — desktop (px, default 56)</label>
        <input
          type="number"
          name="logoHeightDesktop"
          min={16}
          max={200}
          defaultValue={settings.logoHeightDesktop ?? ""}
          placeholder="56"
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Logo height — mobile (px, default 44)</label>
        <input
          type="number"
          name="logoHeightMobile"
          min={16}
          max={200}
          defaultValue={settings.logoHeightMobile ?? ""}
          placeholder="44"
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Logo alignment within its box</label>
        <select name="logoAlign" defaultValue={settings.logoAlign ?? "start"} className={inputClass}>
          <option value="start">Start (left in EN / right in AR)</option>
          <option value="center">Center</option>
          <option value="end">End (right in EN / left in AR)</option>
        </select>
      </div>
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
