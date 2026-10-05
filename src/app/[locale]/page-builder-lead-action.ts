"use server";

import { submitLead, type LeadFormState } from "@/lib/leads/submit-lead";
import { prisma } from "@/lib/prisma";
import { buildVariantsView, variantGraphInclude } from "@/lib/catalog/variants/load";
import { buildQuoteProductLines, parseKey, type ResolvedQuoteItem } from "@/lib/quote/products-field";

/**
 * «المنتجات المطلوبة» of the G7 quote form, from either field type:
 *   - dropdown: `productItems` = "<slug>" or "<slug>~<variantId>" (several variants of one product allowed)
 *   - legacy catalog pills: `productSlugs` + optional `variant.<slug>`
 * Only published products and variants that belong to them count; the AR and EN labels are rebuilt
 * server-side from the catalog, never trusted from the client.
 */
async function resolveCatalogItems(formData: FormData): Promise<ResolvedQuoteItem[]> {
  const picks: { slug: string; variantId: string | null }[] = [];
  for (const raw of formData.getAll("productItems")) {
    const parsed = typeof raw === "string" ? parseKey(raw) : null;
    if (parsed) picks.push(parsed);
  }
  for (const raw of formData.getAll("productSlugs")) {
    if (typeof raw !== "string" || !/^[a-z0-9-]{1,160}$/.test(raw)) continue;
    const variant = formData.get(`variant.${raw}`);
    picks.push({ slug: raw, variantId: typeof variant === "string" && variant ? variant : null });
  }
  const unique = picks.filter((p, i) => picks.findIndex((q) => q.slug === p.slug && q.variantId === p.variantId) === i).slice(0, 30);
  if (unique.length === 0) return [];
  const products = await prisma.product.findMany({
    where: { slug: { in: [...new Set(unique.map((p) => p.slug))] }, isPublished: true },
    include: { translations: true, images: { take: 0, select: { url: true } }, ...variantGraphInclude },
  });
  return unique.flatMap((pick): ResolvedQuoteItem[] => {
    const product = products.find((p) => p.slug === pick.slug);
    if (!product) return [];
    const label = (locale: "ar" | "en") => {
      const name = product.translations.find((t) => t.locale === (locale === "ar" ? "AR" : "EN"))?.name ?? product.sku;
      const view = buildVariantsView(product, locale, true);
      const variant = pick.variantId && view.type === "VARIANT" ? view.variants.find((v) => v.id === pick.variantId) : undefined;
      return { text: variant?.label ? `${name} — ${variant.label}` : name, variantId: variant?.id ?? null };
    };
    const ar = label("ar");
    const en = label("en");
    if (pick.variantId && !ar.variantId) return []; // a variant id that isn't this product's
    return [{ productId: product.id, slug: product.slug, variantId: ar.variantId, labelAr: ar.text, labelEn: en.text }];
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
  const catalogItems = await resolveCatalogItems(formData);
  // The dropdown requires at least one product (also checked in the browser).
  if (formData.get("productsRequired") === "1" && catalogItems.length === 0 && products.length === 0) {
    return { error: isAr ? "اختر منتجًا واحدًا على الأقل" : "Select at least one product" };
  }

  const lines = [
    city ? `${isAr ? "المدينة" : "City"}: ${city}` : null,
    products.length ? `${isAr ? "المنتجات المطلوبة" : "Products"}: ${products.join(isAr ? "، " : ", ")}` : null,
    // Catalog products: one line per item -- readable AR/EN labels plus the product slug and variant id.
    ...buildQuoteProductLines(catalogItems, isAr ? "ar" : "en"),
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
