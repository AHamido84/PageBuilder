import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  combinationLabel,
  defaultVariant,
  variantQuery,
  variantSummaryLine,
  type OptionView,
  type ProductVariantsView,
  type VariantView,
} from "./core";

/**
 * Server loader: turns a Product row (+ its variant graph) into a localized ProductVariantsView.
 *
 * - SIMPLE products (and every product while the feature flag is off) are ONE variant built from the
 *   product's own fields -- the same image/weight/packaging/storage the site rendered before
 *   variants existed -- so nothing has to be migrated for them to keep working.
 * - VARIANT products read each field from the variant, falling back to the product's own field when
 *   the variant leaves it empty.
 */

/** Public-site switch: Admin -> Settings ("variantsEnabled"); VARIANTS_ENABLED=off|on overrides it. */
export const areVariantsEnabled = cache(async (): Promise<boolean> => {
  const env = process.env.VARIANTS_ENABLED?.trim().toLowerCase();
  if (env === "off" || env === "false" || env === "0") return false;
  if (env === "on" || env === "true" || env === "1") return true;
  const settings = await prisma.siteSetting.findUnique({ where: { id: "singleton" }, select: { variantsEnabled: true } });
  return settings?.variantsEnabled ?? false;
});

export const variantGraphInclude = {
  options: {
    orderBy: { sortOrder: "asc" },
    include: { optionType: true, values: { orderBy: { sortOrder: "asc" } } },
  },
  variants: {
    orderBy: { sortOrder: "asc" },
    include: {
      optionValues: { include: { optionValue: { select: { id: true, key: true, productOptionId: true } } } },
      images: { orderBy: { sortOrder: "asc" } },
      specs: { orderBy: { sortOrder: "asc" } },
    },
  },
} satisfies Prisma.ProductInclude;

/** Everything `buildVariantsView` reads, for callers composing their own include. */
export const variantViewInclude = {
  translations: true,
  mainImage: { select: { id: true, url: true } },
  images: { orderBy: { createdAt: "asc" }, select: { id: true, url: true } },
  ...variantGraphInclude,
} satisfies Prisma.ProductInclude;

type Graph = Prisma.ProductGetPayload<{ include: typeof variantGraphInclude }>;

export interface VariantViewSource {
  id: string;
  sku: string;
  type: "SIMPLE" | "VARIANT";
  defaultVariantId: string | null;
  weight: string | null;
  translations: { locale: string; name: string; packagingInfo?: string | null; storageInfo?: string | null }[];
  mainImage?: { url: string } | null;
  images: { url: string }[];
  options?: Graph["options"];
  variants?: Graph["variants"];
}

const pick = (locale: string, ar: string | null | undefined, en: string | null | undefined) => (locale === "ar" ? ar || en : en || ar) || null;

/** Legacy gallery order: the main image first, then the rest in upload order, no duplicates. */
function legacyImages(source: VariantViewSource, alt: string) {
  const ordered = source.mainImage ? [source.mainImage, ...source.images.filter((i) => i.url !== source.mainImage!.url)] : source.images;
  return ordered.map((i) => ({ url: i.url, alt }));
}

export function buildVariantsView(source: VariantViewSource, locale: string, enabled: boolean): ProductVariantsView {
  const upper = locale === "ar" ? "AR" : "EN";
  const tr = source.translations.find((t) => t.locale === upper) ?? source.translations[0];
  const productName = tr?.name ?? source.sku;
  const fallback = {
    images: legacyImages(source, productName),
    weight: source.weight,
    packaging: tr?.packagingInfo ?? null,
    storage: tr?.storageInfo ?? null,
  };

  const variantRows = source.variants ?? [];
  if (!enabled || source.type !== "VARIANT" || variantRows.length === 0) {
    const only: VariantView = {
      id: `${source.id}:default`,
      sku: source.sku,
      name: productName,
      label: "",
      options: {},
      ...fallback,
      specs: [],
      available: true,
    };
    return { type: "SIMPLE", options: [], variants: [only], defaultVariantId: only.id };
  }

  const options: OptionView[] = (source.options ?? []).map((o) => ({
    key: o.optionType.key,
    label: pick(locale, o.optionType.labelAr, o.optionType.labelEn) ?? o.optionType.key,
    display: o.optionType.display,
    values: o.values.map((v) => ({ key: v.key, label: pick(locale, v.valueAr, v.valueEn) ?? v.key, swatchHex: v.swatchHex, imageUrl: v.imageUrl })),
  }));
  const optionKeyById = new Map((source.options ?? []).map((o) => [o.id, o.optionType.key]));

  const variants: VariantView[] = variantRows.map((v) => {
    const selection: Record<string, string> = {};
    for (const ov of v.optionValues) {
      const optionKey = optionKeyById.get(ov.optionValue.productOptionId);
      if (optionKey) selection[optionKey] = ov.optionValue.key;
    }
    const label = combinationLabel(options, selection);
    const override = pick(locale, v.nameAr, v.nameEn);
    const images = v.images.map((img) => ({ url: img.url, alt: pick(locale, img.altAr, img.altEn) ?? override ?? `${productName} — ${label}` }));
    return {
      id: v.id,
      sku: v.sku,
      name: override ?? (label ? `${productName} — ${label}` : productName),
      label,
      options: selection,
      images: images.length ? images : fallback.images,
      weight: pick(locale, v.weightAr, v.weightEn) ?? fallback.weight,
      packaging: pick(locale, v.packagingAr, v.packagingEn) ?? fallback.packaging,
      storage: pick(locale, v.storageAr, v.storageEn) ?? fallback.storage,
      specs: v.specs.map((s) => ({ label: pick(locale, s.labelAr, s.labelEn) ?? "", value: pick(locale, s.valueAr, s.valueEn) ?? "" })),
      available: v.available,
    };
  });

  const view: ProductVariantsView = { type: "VARIANT", options, variants, defaultVariantId: source.defaultVariantId ?? variants[0].id };
  view.defaultVariantId = defaultVariant(view).id;
  return view;
}

/* ------------------------------------------------------------------------------------------------
 * Products list option filters
 * ---------------------------------------------------------------------------------------------- */

/** Query keys the products list already uses -- an option with one of these keys gets no filter. */
const RESERVED_PARAMS = new Set(["q", "category", "brand", "temp", "sort", "page", "preview"]);

export interface OptionFilterDef {
  key: string;
  label: string;
  values: { key: string; label: string }[];
}

/** Option filters built from the published VARIANT products in scope (optionally one category). */
export async function loadOptionFilters(locale: string, categorySlug?: string): Promise<OptionFilterDef[]> {
  const rows = await prisma.productOption.findMany({
    where: { product: { isPublished: true, type: "VARIANT", ...(categorySlug ? { category: { slug: categorySlug } } : {}) } },
    include: { optionType: true, values: { where: { variants: { some: {} } }, orderBy: { sortOrder: "asc" } } },
    orderBy: [{ optionType: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });
  const byKey = new Map<string, OptionFilterDef>();
  for (const row of rows) {
    const key = row.optionType.key;
    if (RESERVED_PARAMS.has(key)) continue;
    const filter = byKey.get(key) ?? { key, label: pick(locale, row.optionType.labelAr, row.optionType.labelEn) ?? key, values: [] };
    for (const v of row.values) {
      if (!filter.values.some((x) => x.key === v.key)) filter.values.push({ key: v.key, label: pick(locale, v.valueAr, v.valueEn) ?? v.key });
    }
    byKey.set(key, filter);
  }
  return [...byKey.values()].filter((f) => f.values.length > 0);
}

/** The valid option filter params in `params` (unknown keys/values dropped). */
export function optionFilterSelection(filters: OptionFilterDef[], params: Record<string, string | string[] | undefined>): Record<string, string> {
  const selection: Record<string, string> = {};
  for (const f of filters) {
    const raw = params[f.key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value && f.values.some((v) => v.key === value)) selection[f.key] = value;
  }
  return selection;
}

/** Products with at least ONE variant matching every selected option value. */
export function optionFilterWhere(selection: Record<string, string>): Prisma.ProductWhereInput {
  const entries = Object.entries(selection);
  if (entries.length === 0) return {};
  return {
    variants: {
      some: {
        AND: entries.map(([optionKey, valueKey]) => ({
          optionValues: { some: { optionValue: { key: valueKey, productOption: { optionType: { key: optionKey } } } } },
        })),
      },
    },
  };
}

/**
 * ProductCard overrides for a VARIANT product: the chosen variant's image and weight (default
 * variant unless `pickVariant` returns another, e.g. the one matching a list filter), the options
 * summary line, and a query preselecting a non-default variant. `{}` for SIMPLE products or when the
 * flag is off, so those cards stay exactly as before.
 */
export function cardVariantFields(
  source: VariantViewSource,
  locale: string,
  enabled: boolean,
  pickVariant?: (view: ProductVariantsView) => VariantView | undefined
) {
  if (!enabled || source.type !== "VARIANT" || !source.variants?.length) return {};
  const view = buildVariantsView(source, locale, true);
  const variant = pickVariant?.(view) ?? defaultVariant(view);
  return {
    imageUrl: variant.images[0]?.url ?? null,
    imageWidth: null,
    imageHeight: null,
    mobileImageUrl: null,
    weight: variant.weight,
    variantSummary: variantSummaryLine(view, locale),
    variantQuery: variant.id === view.defaultVariantId ? null : variantQuery(view, variant),
  };
}
