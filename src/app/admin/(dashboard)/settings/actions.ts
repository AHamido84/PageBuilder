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
});

export async function updateGeneralSettingsAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "settings", "update");

  const parsed = generalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;

  await prisma.siteSetting.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", siteNameEn: data.siteNameEn, siteNameAr: data.siteNameAr, logoId: data.logoId || null, faviconId: data.faviconId || null },
    update: { siteNameEn: data.siteNameEn, siteNameAr: data.siteNameAr, logoId: data.logoId || null, faviconId: data.faviconId || null },
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

const seoSchema = z.object({
  seoDefaultTitleEn: z.string().max(200).optional().or(z.literal("")),
  seoDefaultTitleAr: z.string().max(200).optional().or(z.literal("")),
  seoDefaultDescriptionEn: z.string().max(400).optional().or(z.literal("")),
  seoDefaultDescriptionAr: z.string().max(400).optional().or(z.literal("")),
  analyticsId: z.string().max(50).optional().or(z.literal("")),
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
      defaultOgImageId: data.defaultOgImageId || null,
    },
    update: {
      seoDefaultTitleEn: data.seoDefaultTitleEn || null,
      seoDefaultTitleAr: data.seoDefaultTitleAr || null,
      seoDefaultDescriptionEn: data.seoDefaultDescriptionEn || null,
      seoDefaultDescriptionAr: data.seoDefaultDescriptionAr || null,
      analyticsId: data.analyticsId || null,
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
});

export async function updateFooterSettingsAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "settings", "update");

  const parsed = footerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;

  await prisma.siteSetting.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      siteNameEn: "Seven Eleven Trading",
      siteNameAr: "سفن إليفن للتجارة",
      footerAboutEn: data.footerAboutEn || null,
      footerAboutAr: data.footerAboutAr || null,
    },
    update: { footerAboutEn: data.footerAboutEn || null, footerAboutAr: data.footerAboutAr || null },
  });

  await logSettingsUpdate(currentUser.id, "footer");
  revalidatePath("/admin/settings");
  return { success: true };
}
