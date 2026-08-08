"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const leadSchema = z.object({
  companyName: z.string().max(200).optional().or(z.literal("")),
  contactName: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Enter a valid email"),
  phone: z.string().max(40).optional().or(z.literal("")),
  message: z.string().max(4000).optional().or(z.literal("")),
  locale: z.enum(["EN", "AR"]),
  sourceUrl: z.string().max(500).optional().or(z.literal("")),
  // Honeypot: real users never fill this hidden field.
  website: z.string().max(0).optional().or(z.literal("")),
});

export interface LeadFormState {
  error?: string;
  success?: boolean;
}

export async function submitLeadAction(_prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  const parsed = leadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // Bot filled the honeypot — pretend success, drop silently.
  if (parsed.data.website) {
    return { success: true };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = rateLimit(`lead:${ip}`, 5, 60_000);
  if (!allowed) {
    return { error: "Too many requests. Please try again in a minute." };
  }

  await prisma.lead.create({
    data: {
      companyName: parsed.data.companyName || null,
      contactName: parsed.data.contactName,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      message: parsed.data.message || null,
      locale: parsed.data.locale,
      sourceUrl: parsed.data.sourceUrl || null,
    },
  });

  return { success: true };
}
