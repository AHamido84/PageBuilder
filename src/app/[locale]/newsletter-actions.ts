"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getTranslations } from "next-intl/server";

const schema = z.object({
  email: z.string().email(),
  locale: z.enum(["EN", "AR"]),
});

export interface NewsletterState {
  error?: string;
  success?: boolean;
}

export async function subscribeNewsletterAction(_prev: NewsletterState, formData: FormData): Promise<NewsletterState> {
  // PHASE 11 fix: localized like the rest of the form (was always English).
  const t = await getTranslations({ locale: formData.get("locale") === "AR" ? "ar" : "en", namespace: "formErrors" });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: t("invalidEmail") };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = rateLimit(`newsletter:${ip}`, 5, 60_000);
  if (!allowed) {
    return { error: t("tooManyRequests") };
  }

  await prisma.newsletterSubscriber.upsert({
    where: { email: parsed.data.email },
    create: { email: parsed.data.email, locale: parsed.data.locale },
    update: {},
  });

  return { success: true };
}
