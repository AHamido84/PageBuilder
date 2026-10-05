"use server";

import { submitLead, type LeadFormState } from "@/lib/leads/submit-lead";
import { prisma } from "@/lib/prisma";
import { buildVariantsView, variantGraphInclude } from "@/lib/catalog/variants/load";

/**
 * Catalog pills of the G7 quote form: `productSlugs` + optional `variant.<slug>` (variant id). Only
 * published products and variants that belong to them count; labels are rebuilt server-side from
 * the catalog, never trusted from the client.
 */
async function resolveCatalogItems(formData: FormData, locale: "ar" | "en") {
  const slugs = [...new Set(formData.getAll("productSlugs").filter((v): v is string => typeof v === "string" && /^[a-z0-9-]{1,160}$/.test(v)))].slice(0, 12);
  if (slugs.length === 0) return [];
  const products = await prisma.product.findMany({
    where: { slug: { in: slugs }, isPublished: true },
    include: { translations: true, images: { take: 0, select: { url: true } }, ...variantGraphInclude },
  });
  return slugs.flatMap((slug) => {
    const product = products.find((p) => p.slug === slug);
    if (!product) return [];
    const view = buildVariantsView(product, locale, true);
    const variantId = String(formData.get(`variant.${slug}`) ?? "");
    const variant = view.type === "VARIANT" ? view.variants.find((v) => v.id === variantId) : undefined;
    const name = product.translations.find((t) => t.locale === (locale === "ar" ? "AR" : "EN"))?.name ?? product.sku;
    return [{ productId: product.id, slug, variantId: variant?.id ?? null, label: variant?.label ? `${name} — ${variant.label}` : name }];
  });
}

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
  // "Other city" (G7_QUOTE): the typed city replaces the "other" choice.
  const city = clip(formData.get("cityOther")) || clip(formData.get("city"));
  const quantity = clip(formData.get("quantity"));
  const products = formData.getAll("products").map(clip).filter(Boolean).slice(0, 12);
  const catalogItems = await resolveCatalogItems(formData, isAr ? "ar" : "en");

  const lines = [
    city ? `${isAr ? "المدينة" : "City"}: ${city}` : null,
    products.length ? `${isAr ? "المنتجات المطلوبة" : "Products"}: ${products.join(isAr ? "، " : ", ")}` : null,
    // Catalog pills: one line per item -- readable label plus the product slug and variant id.
    ...(catalogItems.length
      ? [`${isAr ? "المنتجات المطلوبة" : "Products"}:`, ...catalogItems.map((item) => `- ${item.label} [${item.slug}${item.variantId ? ` · ${item.variantId}` : ""}]`)]
      : []),
    quantity ? `${isAr ? "الكمية التقريبية" : "Approximate quantity"}: ${quantity}` : null,
  ].filter(Boolean);

  const lead = new FormData();
  for (const key of ["contactName", "companyName", "email", "phone", "locale", "website"]) {
    const value = formData.get(key);
    if (typeof value === "string") lead.set(key, value);
  }
  if (!lead.has("email")) lead.set("email", "");
  // One catalog product -> also link the lead to it (shown on the lead in /admin/leads).
  if (catalogItems.length === 1) lead.set("productId", catalogItems[0].productId);
  lead.set("inquiryType", "QUOTE");
  lead.set("message", lines.join("\n"));
  return submitLead(lead, "quote-lead", { emailOptional: true });
}
