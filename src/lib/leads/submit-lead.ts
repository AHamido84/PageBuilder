import { z } from "zod";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sendMail } from "@/lib/email";

export const leadSchema = z.object({
  companyName: z.string().max(200).optional().or(z.literal("")),
  contactName: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Enter a valid email"),
  phone: z.string().max(40).optional().or(z.literal("")),
  message: z.string().max(4000).optional().or(z.literal("")),
  locale: z.enum(["EN", "AR"]),
  sourceUrl: z.string().max(500).optional().or(z.literal("")),
  productId: z.string().optional().or(z.literal("")),
  inquiryType: z.enum(["GENERAL", "INFO", "QUOTE", "BECOME_CUSTOMER", "SALES_INQUIRY"]).optional().or(z.literal("")),
  // Honeypot: real users never fill this hidden field.
  website: z.string().max(0).optional().or(z.literal("")),
});

export interface LeadFormState {
  error?: string;
  success?: boolean;
}

/**
 * Shared honeypot + rate-limit + create pipeline for any public lead-capture
 * form (the site-wide contact form, product inquiry, and page-builder Contact
 * Form/Quote Form blocks). Runs unauthenticated by design -- the submitter
 * has no admin session, so this intentionally never calls assertCan.
 */
export async function submitLead(formData: FormData, rateLimitKeyPrefix = "lead"): Promise<LeadFormState> {
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
  const { allowed } = rateLimit(`${rateLimitKeyPrefix}:${ip}`, 5, 60_000);
  if (!allowed) {
    return { error: "Too many requests. Please try again in a minute." };
  }

  const referer = h.get("referer") ?? "";

  // If a productId was supplied but doesn't resolve to a real product, drop the
  // link rather than fail the whole submission -- a stale/tampered id shouldn't
  // block a genuine inquiry.
  const productId = parsed.data.productId
    ? await prisma.product.findUnique({ where: { id: parsed.data.productId }, select: { id: true } }).then((p) => p?.id ?? null)
    : null;

  const lead = await prisma.lead.create({
    data: {
      companyName: parsed.data.companyName || null,
      contactName: parsed.data.contactName,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      message: parsed.data.message || null,
      locale: parsed.data.locale,
      sourceUrl: parsed.data.sourceUrl || referer || null,
      productId,
      inquiryType: parsed.data.inquiryType || "GENERAL",
    },
  });

  const settings = await prisma.siteSetting.findUnique({ where: { id: "singleton" }, select: { contactEmail: true } });
  if (settings?.contactEmail) {
    await sendMail({
      to: settings.contactEmail,
      subject: `New ${lead.inquiryType.toLowerCase().replace("_", " ")} lead — ${lead.contactName}`,
      text: [
        `Contact: ${lead.contactName}`,
        lead.companyName ? `Company: ${lead.companyName}` : null,
        `Email: ${lead.email}`,
        lead.phone ? `Phone: ${lead.phone}` : null,
        `Type: ${lead.inquiryType}`,
        lead.message ? `\nMessage:\n${lead.message}` : null,
        `\nView in admin: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/leads/${lead.id}`,
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }

  return { success: true };
}
