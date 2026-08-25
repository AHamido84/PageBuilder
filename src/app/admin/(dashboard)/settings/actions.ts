"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { logActivity } from "@/lib/activity-log";

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
  // Kept as validated raw strings (not z.coerce.number()) so an empty field reliably means "unset"
  // -- z.coerce.number() turns "" into 0, which would incorrectly persist as a real 0px height.
  logoHeightDesktop: z.string().regex(/^\d*$/, "Must be a whole number of pixels.").optional().or(z.literal("")),
  logoHeightMobile: z.string().regex(/^\d*$/, "Must be a whole number of pixels.").optional().or(z.literal("")),
  logoAlign: z.enum(["start", "center", "end"]).optional().or(z.literal("")),
});

export async function updateGeneralSettingsAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "settings", "update");

  const parsed = generalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;
  const values = {
    siteNameEn: data.siteNameEn,
    siteNameAr: data.siteNameAr,
    logoId: data.logoId || null,
    faviconId: data.faviconId || null,
    logoHeightDesktop: data.logoHeightDesktop ? Number(data.logoHeightDesktop) : null,
    logoHeightMobile: data.logoHeightMobile ? Number(data.logoHeightMobile) : null,
    logoAlign: data.logoAlign || null,
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
