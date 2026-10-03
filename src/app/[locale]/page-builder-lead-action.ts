"use server";

import { submitLead, type LeadFormState } from "@/lib/leads/submit-lead";

/** Shared submission action for page-builder CONTACT_FORM and QUOTE_FORM blocks. */
export async function submitBlockLeadAction(_prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  return submitLead(formData, "block-lead");
}

/**
 * Golden Seven home v7 quote form (G7_QUOTE). The Lead model has no city/products/quantity columns,
 * so those answers are folded into the lead message (readable in /admin/leads and the notification
 * email); everything else -- validation, honeypot, rate limit, email -- is the shared submitLead.
 */
export async function submitQuoteRequestAction(_prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  const isAr = formData.get("locale") === "AR";
  const clip = (value: FormDataEntryValue | null) => (typeof value === "string" ? value.trim().slice(0, 120) : "");
  const city = clip(formData.get("city"));
  const quantity = clip(formData.get("quantity"));
  const products = formData.getAll("products").map(clip).filter(Boolean).slice(0, 12);

  const lines = [
    city ? `${isAr ? "المدينة" : "City"}: ${city}` : null,
    products.length ? `${isAr ? "المنتجات المطلوبة" : "Products"}: ${products.join(isAr ? "، " : ", ")}` : null,
    quantity ? `${isAr ? "الكمية التقريبية" : "Approximate quantity"}: ${quantity}` : null,
  ].filter(Boolean);

  const lead = new FormData();
  for (const key of ["contactName", "companyName", "email", "phone", "locale", "website"]) {
    const value = formData.get(key);
    if (typeof value === "string") lead.set(key, value);
  }
  lead.set("inquiryType", "QUOTE");
  lead.set("message", lines.join("\n"));
  return submitLead(lead, "quote-lead");
}
