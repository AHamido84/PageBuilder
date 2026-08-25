"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { logActivity } from "@/lib/activity-log";
import { HEADER_LOGO_DEFAULTS, type HeaderLogoLocaleSettings, type HeaderLogoSettings } from "@/lib/site-settings/header-logo";

export interface FormActionState {
  error?: string;
  success?: boolean;
}

async function logSettingsUpdate(userId: string, section: string) {
  await logActivity({ userId, action: `settings.${section}.update`, entityType: "SiteSetting", entityId: "singleton" });
}

const generalSchema = z.object({
  siteNameEn: z.string().min(1).max(200),
  siteNameAr: z.string().min(1).max(200),
  logoId: z.string().optional().or(z.literal("")),
  faviconId: z.string().optional().or(z.literal("")),
});

const numberField = z.string().regex(/^\d*$/, "Must be a whole number of pixels.").optional().or(z.literal(""));
const headerLogoLocaleSchema = z.object({
  heightDesktop: numberField,
  heightMobile: numberField,
  widthDesktop: numberField,
  widthMobile: numberField,
  maxWidth: numberField,
  spacing: numberField,
  align: z.enum(["start", "center", "end"]).optional().or(z.literal("")),
  sticky: z.string().optional().or(z.literal("")),
  hidden: z.string().optional().or(z.literal("")),
});

/** Reassembles one locale's flattened `headerLogo.<locale>.<field>` form fields (see
 * LogoLocaleFields in settings-forms.tsx) back into a HeaderLogoLocaleSettings, independent of the
 * other locale's fields -- each language's box size/alignment/sticky/hide is validated and stored
 * on its own branch, so an admin can never accidentally cross-apply one language's settings to the
 * other purely by submitting this form. */
function parseHeaderLogoLocale(formData: FormData, locale: "en" | "ar"): HeaderLogoLocaleSettings | { error: string } {
  const raw = Object.fromEntries(
    ["heightDesktop", "heightMobile", "widthDesktop", "widthMobile", "maxWidth", "spacing", "align", "sticky", "hidden"].map((field) => [
      field,
      formData.get(`headerLogo.${locale}.${field}`) ?? "",
    ])
  );
  const parsed = headerLogoLocaleSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? `Invalid ${locale.toUpperCase()} logo settings.` };
  const d = parsed.data;
  const defaults = HEADER_LOGO_DEFAULTS;
  return {
    heightDesktop: d.heightDesktop ? Number(d.heightDesktop) : defaults.heightDesktop,
    heightMobile: d.heightMobile ? Number(d.heightMobile) : defaults.heightMobile,
    widthDesktop: d.widthDesktop ? Number(d.widthDesktop) : null,
    widthMobile: d.widthMobile ? Number(d.widthMobile) : null,
    maxWidth: d.maxWidth ? Number(d.maxWidth) : null,
    spacing: d.spacing ? Number(d.spacing) : defaults.spacing,
    align: d.align || defaults.align,
    sticky: d.sticky === "true",
    hidden: d.hidden === "true",
  };
}

export async function updateGeneralSettingsAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "settings", "update");

  const parsed = generalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;

  const en = parseHeaderLogoLocale(formData, "en");
  if ("error" in en) return { error: en.error };
  const ar = parseHeaderLogoLocale(formData, "ar");
  if ("error" in ar) return { error: ar.error };
  const headerLogo: HeaderLogoSettings = { en, ar };

  const values = {
    siteNameEn: data.siteNameEn,
    siteNameAr: data.siteNameAr,
    logoId: data.logoId || null,
    faviconId: data.faviconId || null,
    headerLogo: headerLogo as unknown as Prisma.InputJsonValue,
  };

  await prisma.siteSetting.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...values },
    update: values,
  });

  await logSettingsUpdate(currentUser.id, "general");
  revalidatePath("/admin/settings");
  return { success: true };
}

const contactSchema = z.object({
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().max(40).optional().or(z.literal("")),
  whatsapp: z.string().max(40).optional().or(z.literal("")),
  address: z.string().max(400).optional().or(z.literal("")),
  mapEmbedUrl: z.string().max(500).optional().or(z.literal("")),
});

export async function updateContactSettingsAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "settings", "update");

  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;

  await prisma.siteSetting.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      siteNameEn: "Seven Eleven Trading",
      siteNameAr: "سفن إليفن للتجارة",
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone || null,
      whatsapp: data.whatsapp || null,
      address: data.address || null,
      mapEmbedUrl: data.mapEmbedUrl || null,
    },
    update: {
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone || null,
      whatsapp: data.whatsapp || null,
      address: data.address || null,
      mapEmbedUrl: data.mapEmbedUrl || null,
    },
  });

  await logSettingsUpdate(currentUser.id, "contact");
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function updateSocialSettingsAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "settings", "update");

  const socialLinks = {
    facebook: (formData.get("facebook") as string) || undefined,
    instagram: (formData.get("instagram") as string) || undefined,
    linkedin: (formData.get("linkedin") as string) || undefined,
    twitter: (formData.get("twitter") as string) || undefined,
  };

  await prisma.siteSetting.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", siteNameEn: "Seven Eleven Trading", siteNameAr: "سفن إليفن للتجارة", socialLinks },
    update: { socialLinks },
  });

  await logSettingsUpdate(currentUser.id, "social");
  revalidatePath("/admin/settings");
  return { success: true };
}

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

export async function updateHoursSettingsAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "settings", "update");

  const businessHours: Record<string, string> = {};
  for (const day of DAYS) {
    businessHours[day] = (formData.get(day) as string) || "Closed";
  }

  await prisma.siteSetting.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", siteNameEn: "Seven Eleven Trading", siteNameAr: "سفن إليفن للتجارة", businessHours },
    update: { businessHours },
  });

  await logSettingsUpdate(currentUser.id, "hours");
  revalidatePath("/admin/settings");
  return { success: true };
}

// Analytics IDs get interpolated directly into inline <script> content (see
// analytics-scripts.tsx) to build the vendor init snippets, so they're restricted to the
// real-world character set for each ID format -- this is what stops a malicious/compromised
// admin account from using this field to inject arbitrary JS that would then run for every
// site visitor (not just an admin-only self-XSS, since these settings render sitewide).
const ga4IdSchema = z.string().regex(/^G-[A-Z0-9]+$/, "Must look like a GA4 measurement ID, e.g. G-XXXXXXXXXX.");
const gtmIdSchema = z.string().regex(/^GTM-[A-Z0-9]+$/, "Must look like a GTM container ID, e.g. GTM-XXXXXXX.");
const pixelIdSchema = z.string().regex(/^\d+$/, "Must be a numeric Meta Pixel ID.");

const seoSchema = z.object({
  seoDefaultTitleEn: z.string().max(200).optional().or(z.literal("")),
  seoDefaultTitleAr: z.string().max(200).optional().or(z.literal("")),
  seoDefaultDescriptionEn: z.string().max(400).optional().or(z.literal("")),
  seoDefaultDescriptionAr: z.string().max(400).optional().or(z.literal("")),
  analyticsId: ga4IdSchema.optional().or(z.literal("")),
  gtmId: gtmIdSchema.optional().or(z.literal("")),
  metaPixelId: pixelIdSchema.optional().or(z.literal("")),
  defaultOgImageId: z.string().optional().or(z.literal("")),
});

export async function updateSeoSettingsAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "settings", "update");

  const parsed = seoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;

  await prisma.siteSetting.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      siteNameEn: "Seven Eleven Trading",
      siteNameAr: "سفن إليفن للتجارة",
      seoDefaultTitleEn: data.seoDefaultTitleEn || null,
      seoDefaultTitleAr: data.seoDefaultTitleAr || null,
      seoDefaultDescriptionEn: data.seoDefaultDescriptionEn || null,
      seoDefaultDescriptionAr: data.seoDefaultDescriptionAr || null,
      analyticsId: data.analyticsId || null,
      gtmId: data.gtmId || null,
      metaPixelId: data.metaPixelId || null,
      defaultOgImageId: data.defaultOgImageId || null,
    },
    update: {
      seoDefaultTitleEn: data.seoDefaultTitleEn || null,
      seoDefaultTitleAr: data.seoDefaultTitleAr || null,
      seoDefaultDescriptionEn: data.seoDefaultDescriptionEn || null,
      seoDefaultDescriptionAr: data.seoDefaultDescriptionAr || null,
      analyticsId: data.analyticsId || null,
      gtmId: data.gtmId || null,
      metaPixelId: data.metaPixelId || null,
      defaultOgImageId: data.defaultOgImageId || null,
    },
  });

  await logSettingsUpdate(currentUser.id, "seo");
  revalidatePath("/admin/settings");
  return { success: true };
}

const footerSchema = z.object({
  footerAboutEn: z.string().max(600).optional().or(z.literal("")),
  footerAboutAr: z.string().max(600).optional().or(z.literal("")),
  newsletterTitleEn: z.string().max(200).optional().or(z.literal("")),
  newsletterTitleAr: z.string().max(200).optional().or(z.literal("")),
  newsletterBodyEn: z.string().max(400).optional().or(z.literal("")),
  newsletterBodyAr: z.string().max(400).optional().or(z.literal("")),
});

export async function updateFooterSettingsAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "settings", "update");

  const parsed = footerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;
  const values = {
    footerAboutEn: data.footerAboutEn || null,
    footerAboutAr: data.footerAboutAr || null,
    newsletterTitleEn: data.newsletterTitleEn || null,
    newsletterTitleAr: data.newsletterTitleAr || null,
    newsletterBodyEn: data.newsletterBodyEn || null,
    newsletterBodyAr: data.newsletterBodyAr || null,
  };

  await prisma.siteSetting.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      siteNameEn: "Seven Eleven Trading",
      siteNameAr: "سفن إليفن للتجارة",
      ...values,
    },
    update: values,
  });

  await logSettingsUpdate(currentUser.id, "footer");
  revalidatePath("/admin/settings");
  return { success: true };
}
