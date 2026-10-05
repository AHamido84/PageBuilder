import { prisma } from "@/lib/prisma";
import type { G7BrandItem, G7BrandsData, G7CategoriesData, G7CategoryItem, G7ProductItem, G7ProductsData, G7QuoteData } from "./schema";
import { areVariantsEnabled, buildVariantsView, variantGraphInclude } from "@/lib/catalog/variants/load";
import { pluralize, PRODUCT_NOUN, VARIANT_NOUN, variantQuery, variantSummaryLine } from "@/lib/catalog/variants/core";

/**
 * Server-side hydration for the G7 catalog blocks: every card links to (and counts from) the real
 * catalog -- the single source of truth -- instead of a hand-typed URL or number.
 *
 * Resolution order per card:
 *   1. an explicit catalog reference picked in the Page Builder (productId / categoryId / brandId);
 *   2. a custom URL the editor typed (anything other than the generic list URL);
 *   3. an automatic match of the card's text against catalog names in the same language
 *      (normalized: Arabic letter variants, digits, units; numbers must agree, best match must be
 *      clear), so already-published cards link correctly without a content edit;
 *   4. the card's own URL (generic list) as the last resort.
 */

export type G7Resolved<T> = T & { href?: string; countLabel?: string; resolvedTitle?: string; variantSummary?: string | null };

const GENERIC_URLS = new Set(["", "/", "/products", "/products/", "/brands", "/brands/"]);
const isGeneric = (url: string | undefined) => GENERIC_URLS.has((url ?? "").trim());

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const UNITS: Record<string, string> = { مم: "mm", مللي: "mm", ملم: "mm", ملي: "mm", mm: "mm", كجم: "kg", كيلو: "kg", kg: "kg", جم: "g", g: "g" };

export function normalizeName(text: string): string {
  return text
    .toLowerCase()
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/٫/g, ".")
    .replace(/[ً-ٰٟـ]/g, "") // diacritics + tatweel
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/(\d)([a-z؀-ۿ])/g, "$1 $2") // "10mm" -> "10 mm"
    .replace(/[^\p{L}\p{N}.\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(text: string): string[] {
  return normalizeName(text)
    .split(" ")
    .filter(Boolean)
    .map((t) => UNITS[t] ?? t)
    .map((t) => (/^(وال|بال|لل)/.test(t) && t.length > 4 ? t.slice(3) : /^ال/.test(t) && t.length > 3 ? t.slice(2) : t));
}

function jaccard(a: string[], b: string[]): number {
  const A = new Set(a);
  const B = new Set(b);
  const inter = [...A].filter((x) => B.has(x)).length;
  return inter / (A.size + B.size - inter || 1);
}

const numbers = (t: string[]) => t.filter((x) => /^\d+(\.\d+)?$/.test(x)).sort().join(",");

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

/** Best catalog candidate for `text`, or null when nothing matches clearly. */
export function bestMatch<C extends { id: string; names: string[] }>(text: string, candidates: C[], mode: "product" | "name"): C | null {
  const t = tokens(text);
  if (t.length === 0) return null;
  const scored = candidates
    .map((c) => {
      let score = 0;
      for (const name of c.names) {
        const n = tokens(name);
        if (n.length === 0) continue;
        if (mode === "product" && numbers(t) !== numbers(n)) continue;
        let s = jaccard(t, n);
        if (mode === "name") {
          const joinedT = t.join("");
          const joinedN = n.join("");
          if (joinedT === joinedN) s = 1;
          else if (levenshtein(joinedT, joinedN) <= 2) s = Math.max(s, 0.9);
          else if (n.every((x) => t.includes(x))) s = Math.max(s, 0.8);
        }
        score = Math.max(score, s);
      }
      return { c, score };
    })
    .sort((a, b) => b.score - a.score);
  const [first, second] = scored;
  if (!first || first.score < 0.5) return null;
  if (second && first.score - second.score < 0.1) return null;
  return first.c;
}

const upper = (locale: string) => (locale === "ar" ? "AR" : "EN");

/* ------------------------------------------------------------------------------------------------ */

export async function resolveG7Products(data: G7ProductsData, locale: string): Promise<G7ProductsData> {
  const variantsEnabled = await areVariantsEnabled();
  const products = await prisma.product.findMany({
    where: { isPublished: true },
    include: { translations: true, mainImage: { select: { url: true } }, images: { take: 1, orderBy: { createdAt: "asc" }, select: { url: true } }, ...variantGraphInclude },
  });
  type Candidate = { id: string; slug: string; names: string[]; query?: string; summary?: string | null };
  const candidates: Candidate[] = products.flatMap((p) => {
    const names = p.translations.filter((t) => t.locale === upper(locale)).map((t) => t.name);
    // Matching always knows the variants (even with the public flag off), so cards typed per variant
    // keep linking after a merge; the summary line is only shown while variants are enabled.
    const view = buildVariantsView(p, locale, true);
    const base: Candidate = { id: p.id, slug: p.slug, names, summary: variantsEnabled ? variantSummaryLine(view, locale) : null };
    if (view.type !== "VARIANT") return [base];
    // A merged variant product still matches cards typed per variant ("أبشر بالبطاطس — ١٠ مم"),
    // linking to that variant preselected.
    const perVariant = view.variants.map((v) => ({ id: `${p.id}:${v.id}`, slug: p.slug, names: [v.name, ...names.map((n) => `${n} ${v.label}`)], query: variantQuery(view, v) }));
    return [base, ...perVariant];
  });
  const hrefOf = (c: Candidate) => `/products/${c.slug}${c.query ? `?${c.query}` : ""}`;
  const items = (data.items ?? []).map((item): G7Resolved<G7ProductItem> => {
    const explicit = item.productId ? candidates.find((c) => c.id === item.productId) : undefined;
    if (explicit) return { ...item, href: hrefOf(explicit), variantSummary: explicit.summary ?? null };
    // A typed /products/<slug> URL only counts if that product exists -- a stale or mistyped slug
    // falls back to the catalog match instead of shipping a dead link.
    const typedSlug = /^\/products\/([^/?#]+)\/?$/.exec((item.url ?? "").trim())?.[1];
    const typedValid = typedSlug ? candidates.some((c) => c.slug === typedSlug) : true;
    if (!isGeneric(item.url) && typedValid) return { ...item, href: item.url };
    const match = bestMatch(item.name ?? "", candidates, "product");
    return { ...item, href: match ? hrefOf(match) : item.url || "/products", variantSummary: match?.summary ?? null };
  });
  return { ...data, items };
}

export async function resolveG7Categories(data: G7CategoriesData, locale: string): Promise<G7CategoriesData> {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, translations: { select: { locale: true, name: true } } },
  });
  const candidates = categories.map((c) => ({ id: c.id, slug: c.slug, names: c.translations.filter((t) => t.locale === upper(locale)).map((t) => t.name) }));
  const items = (data.items ?? []).map((item): G7Resolved<G7CategoryItem> => {
    const explicit = item.categoryId ? candidates.find((c) => c.id === item.categoryId) : undefined;
    const match = explicit ?? (isGeneric(item.url) ? bestMatch(item.title ?? "", candidates, "name") : null);
    if (!match) return { ...item, href: item.url || "/products" };
    // The card title follows the catalog's category name (one place to fix a name or typo).
    return { ...item, href: `/products?category=${match.slug}`, resolvedTitle: match.names[0] || item.title };
  });
  return { ...data, items };
}

/** Quote form pills from the catalog (only while variants are enabled; otherwise the typed pills stay). */
export interface QuoteCatalogItem {
  slug: string;
  label: string;
  variants: { id: string; label: string }[];
}

export async function resolveG7Quote(data: G7QuoteData, locale: string): Promise<G7QuoteData & { catalog?: QuoteCatalogItem[] }> {
  if (!(await areVariantsEnabled())) return data;
  const products = await prisma.product.findMany({
    where: { isPublished: true },
    orderBy: [{ category: { order: "asc" } }, { createdAt: "asc" }],
    include: { translations: true, images: { take: 0, select: { url: true } }, ...variantGraphInclude },
  });
  const catalog = products.map((p): QuoteCatalogItem => {
    const view = buildVariantsView(p, locale, true);
    const name = p.translations.find((t) => t.locale === upper(locale))?.name ?? p.sku;
    return {
      slug: p.slug,
      label: name,
      variants: view.type === "VARIANT" && view.variants.length > 1 ? view.variants.map((v) => ({ id: v.id, label: v.label || v.name })) : [],
    };
  });
  return catalog.length ? { ...data, catalog } : data;
}

/** "منتج واحد" / "منتجان" / "٣ منتجات" / "١١ منتجًا" -- or "1 product" / "8 products". */
export function productCountLabel(count: number, locale: string): string {
  if (count === 0) return locale === "ar" ? "لا توجد منتجات" : "0 products";
  return pluralize(count, PRODUCT_NOUN, locale);
}

/** Brand card count: products, plus variants when any product has several -- «منتج واحد · نوعان». */
export function brandCountLabel(products: number, variants: number, locale: string): string {
  const base = productCountLabel(products, locale);
  return variants > products ? `${base} · ${pluralize(variants, VARIANT_NOUN, locale)}` : base;
}

export async function resolveG7Brands(data: G7BrandsData, locale: string): Promise<G7BrandsData> {
  const variantsEnabled = await areVariantsEnabled();
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      translations: { select: { locale: true, name: true } },
      products: { where: { isPublished: true }, select: { type: true, _count: { select: { variants: true } } } },
    },
  });
  const candidates = brands.map((b) => ({
    id: b.id,
    slug: b.slug,
    count: b.products.length,
    // A SIMPLE product (or any product while variants are off) counts as one variant.
    variants: b.products.reduce((sum, p) => sum + (variantsEnabled && p.type === "VARIANT" && p._count.variants > 0 ? p._count.variants : 1), 0),
    names: [...b.translations.filter((t) => t.locale === upper(locale)).map((t) => t.name), b.slug.replace(/-/g, " ")],
  }));
  const items = (data.items ?? []).map((item): G7Resolved<G7BrandItem> => {
    const explicit = item.brandId ? candidates.find((c) => c.id === item.brandId) : undefined;
    const match = explicit ?? bestMatch(item.name ?? "", candidates, "name");
    if (!match) return { ...item, href: item.url || "/brands" };
    return { ...item, href: isGeneric(item.url) ? `/brands/${match.slug}` : item.url, countLabel: brandCountLabel(match.count, match.variants, locale) };
  });
  return { ...data, items };
}
