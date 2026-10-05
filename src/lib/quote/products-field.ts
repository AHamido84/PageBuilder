import { matchesSearch } from "@/lib/text/arabic-normalize";

/**
 * «المنتجات المطلوبة» (G7 quote form) -- pure model shared by the dropdown, the form and the server
 * action. Pure + client-safe.
 *
 * Selection keys (one hidden `productItems` input each):
 *   "<slug>"               the product (for a variant product: «أي مقاس», any variant)
 *   "<slug>~<variantId>"   one specific variant
 * A product's "any" key and its variant keys are mutually exclusive.
 */

export interface QuoteCatalogVariant {
  id: string;
  label: string;
}

export interface QuoteCatalogItem {
  slug: string;
  label: string;
  thumbUrl?: string | null;
  categoryId?: string | null;
  variants: QuoteCatalogVariant[];
}

export interface QuoteCatalogGroup {
  id: string;
  label: string;
  items: QuoteCatalogItem[];
}

export const VARIANT_SEP = "~";
const KEY_RE = /^[a-z0-9-]{1,160}(~[a-z0-9]{1,40})?$/;

export const variantKey = (slug: string, variantId: string) => `${slug}${VARIANT_SEP}${variantId}`;

export function parseKey(key: string): { slug: string; variantId: string | null } | null {
  if (!KEY_RE.test(key)) return null;
  const [slug, variantId] = key.split(VARIANT_SEP);
  return { slug, variantId: variantId ?? null };
}

/** Toggles one key; checking a product's «any» clears its variants and vice versa. */
export function toggleKey(selected: string[], key: string, max = 0): string[] {
  if (selected.includes(key)) return selected.filter((k) => k !== key);
  const parsed = parseKey(key);
  if (!parsed) return selected;
  const next = selected.filter((k) => {
    const p = parseKey(k);
    if (!p || p.slug !== parsed.slug) return true;
    // Same product: "any" excludes specific variants, a specific variant excludes "any".
    return parsed.variantId ? p.variantId !== null : false;
  });
  if (max > 0 && next.length >= max) return selected;
  return [...next, key];
}

/** Selects every product of a group («تحديد الكل»), keeping other groups' picks; respects `max`. */
export function selectGroup(selected: string[], group: QuoteCatalogGroup, max = 0): string[] {
  const slugs = new Set(group.items.map((i) => i.slug));
  const kept = selected.filter((k) => !slugs.has(parseKey(k)?.slug ?? ""));
  const added = group.items.map((i) => i.slug);
  const all = [...kept, ...added];
  return max > 0 ? all.slice(0, Math.max(max, kept.length)) : all;
}

export function clearGroup(selected: string[], group: QuoteCatalogGroup): string[] {
  const slugs = new Set(group.items.map((i) => i.slug));
  return selected.filter((k) => !slugs.has(parseKey(k)?.slug ?? ""));
}

/** Readable label of a key from the catalog («أبشر بالبطاطس — ٧ مم», or the product name for «any»). */
export function keyLabel(catalog: QuoteCatalogItem[], key: string): string | null {
  const parsed = parseKey(key);
  const item = parsed ? catalog.find((c) => c.slug === parsed.slug) : undefined;
  if (!parsed || !item) return null;
  if (!parsed.variantId) return item.label;
  const variant = item.variants.find((v) => v.id === parsed.variantId);
  return variant ? `${item.label} — ${variant.label}` : null;
}

/** Keeps only keys that still exist in the catalog (stale prefill / removed product). */
export function validKeys(catalog: QuoteCatalogItem[], keys: string[]): string[] {
  return [...new Set(keys)].filter((k) => keyLabel(catalog, k) !== null);
}

/** `?product=<slug>&variant=<id>` -> the key to preselect (the variant when it belongs to the product). */
export function prefillKey(catalog: QuoteCatalogItem[], product: string | null, variant: string | null): string | null {
  const item = product ? catalog.find((c) => c.slug === product) : undefined;
  if (!item) return null;
  return variant && item.variants.some((v) => v.id === variant) ? variantKey(item.slug, variant) : item.slug;
}

export interface FilteredItem {
  item: QuoteCatalogItem;
  /** Variants to list under the product (all, or only the matching ones while searching). */
  variants: QuoteCatalogVariant[];
  /** A search hit on a variant opens the row. */
  autoExpand: boolean;
}

/** Arabic-normalized search over product and variant names; empty groups drop out. */
export function filterCatalog(groups: QuoteCatalogGroup[], query: string): { group: QuoteCatalogGroup; items: FilteredItem[] }[] {
  const q = query.trim();
  return groups
    .map((group) => ({
      group,
      items: group.items.flatMap((item): FilteredItem[] => {
        if (!q || matchesSearch(item.label, q)) return [{ item, variants: item.variants, autoExpand: false }];
        const variants = item.variants.filter((v) => matchesSearch(`${item.label} ${v.label}`, q));
        return variants.length ? [{ item, variants, autoExpand: true }] : [];
      }),
    }))
    .filter((g) => g.items.length > 0);
}

/** Groups catalog items by category, in the given category order; uncategorized items last. */
export function groupCatalog(items: QuoteCatalogItem[], categories: { id: string; label: string }[], grouped: boolean, allLabel: string): QuoteCatalogGroup[] {
  if (!grouped) return items.length ? [{ id: "all", label: allLabel, items }] : [];
  const groups = categories.map((c) => ({ id: c.id, label: c.label, items: items.filter((i) => i.categoryId === c.id) }));
  const rest = items.filter((i) => !categories.some((c) => c.id === i.categoryId));
  if (rest.length) groups.push({ id: "other", label: allLabel, items: rest });
  return groups.filter((g) => g.items.length > 0);
}

/* ---------------------------------------------------------------------------------------------- *
 * Server payload -> readable lead lines
 * ---------------------------------------------------------------------------------------------- */

export interface ResolvedQuoteItem {
  productId: string;
  slug: string;
  variantId: string | null;
  labelAr: string;
  labelEn: string;
}

/**
 * Lead message lines for the picked products: the submitter's language first, the other language
 * after a slash when it differs, then the slug / variant id for the team.
 *   - أبشر بالبطاطس — ٧ مم / Absher French Fries — 7 mm [absher-french-fries · cm123]
 */
export function buildQuoteProductLines(items: ResolvedQuoteItem[], locale: "ar" | "en"): string[] {
  if (items.length === 0) return [];
  const heading = locale === "ar" ? "المنتجات المطلوبة:" : "Products:";
  return [
    heading,
    ...items.map((item) => {
      const primary = locale === "ar" ? item.labelAr : item.labelEn;
      const secondary = locale === "ar" ? item.labelEn : item.labelAr;
      const both = secondary && secondary !== primary ? `${primary} / ${secondary}` : primary;
      return `- ${both} [${item.slug}${item.variantId ? ` · ${item.variantId}` : ""}]`;
    }),
  ];
}
