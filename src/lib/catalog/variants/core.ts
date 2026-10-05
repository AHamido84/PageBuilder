/**
 * Variant products -- pure, client-safe logic (no Prisma, no server imports), shared by the public
 * product page, the product card, the products list filters, the quote form and the admin editor.
 *
 * A product is always seen as a list of variants. A SIMPLE product is one variant built from the
 * product's own fields (see ./load.ts), so the public site has a single code path for both types.
 */

export type OptionDisplay = "PILL" | "SWATCH" | "IMAGE" | "SELECT";

export interface OptionValueView {
  key: string;
  label: string;
  swatchHex: string | null;
  imageUrl: string | null;
}

export interface OptionView {
  key: string;
  label: string;
  display: OptionDisplay;
  values: OptionValueView[];
}

export interface VariantImageView {
  url: string;
  alt: string;
}

export interface VariantView {
  id: string;
  sku: string | null;
  /** Display name: the variant's own override, else "<product> — <value> · <value>". */
  name: string;
  /** Option labels only, e.g. "٧ مم · ٢٫٥ كجم" (empty for a SIMPLE product). */
  label: string;
  /** optionKey -> valueKey */
  options: Record<string, string>;
  images: VariantImageView[];
  /** The variant's own descriptions, else the product's. */
  shortDescription: string | null;
  description: string | null;
  weight: string | null;
  packaging: string | null;
  storage: string | null;
  specs: { label: string; value: string }[];
  available: boolean;
}

/** One product's variants, already localized to the page's locale. */
export interface ProductVariantsView {
  type: "SIMPLE" | "VARIANT";
  options: OptionView[];
  variants: VariantView[];
  defaultVariantId: string;
}

/* ------------------------------------------------------------------------------------------------
 * Arabic plurals: ١ واحد · ٢ مثنى · ٣–١٠ جمع · ١١+ مفرد منصوب
 * ---------------------------------------------------------------------------------------------- */

export interface ArNounForms {
  /** "مقاس واحد" */
  one: string;
  /** "مقاسان" */
  two: string;
  /** plural used for 3–10: "مقاسات" */
  few: string;
  /** singular (accusative) used for 11+: "مقاسًا" */
  many: string;
}

export interface NounForms {
  ar: ArNounForms;
  en: { one: string; other: string };
}

export function arabicDigits(n: number): string {
  return new Intl.NumberFormat("ar-EG", { useGrouping: false }).format(n);
}

/** `pluralizeAr(2, forms)` -> "مقاسان"; `(4)` -> "٤ مقاسات"; `(11)` -> "١١ مقاسًا". */
export function pluralizeAr(count: number, forms: ArNounForms): string {
  if (count === 1) return forms.one;
  if (count === 2) return forms.two;
  const mod = count % 100;
  if (mod >= 3 && mod <= 10) return `${arabicDigits(count)} ${forms.few}`;
  return `${arabicDigits(count)} ${forms.many}`;
}

export function pluralize(count: number, forms: NounForms, locale: string): string {
  if (locale === "ar") return pluralizeAr(count, forms.ar);
  return `${count} ${count === 1 ? forms.en.one : forms.en.other}`;
}

/** Counting nouns for the seeded option library; any other (admin-created) option counts as "نوع". */
export const OPTION_NOUNS: Record<string, NounForms> = {
  weight: { ar: { one: "وزن واحد", two: "وزنان", few: "أوزان", many: "وزنًا" }, en: { one: "weight", other: "weights" } },
  size: { ar: { one: "مقاس واحد", two: "مقاسان", few: "مقاسات", many: "مقاسًا" }, en: { one: "size", other: "sizes" } },
  shape: { ar: { one: "شكل واحد", two: "شكلان", few: "أشكال", many: "شكلًا" }, en: { one: "shape", other: "shapes" } },
  cut: { ar: { one: "قطعية واحدة", two: "قطعيتان", few: "قطعيات", many: "قطعية" }, en: { one: "cut", other: "cuts" } },
  color: { ar: { one: "لون واحد", two: "لونان", few: "ألوان", many: "لونًا" }, en: { one: "color", other: "colors" } },
  flavor: { ar: { one: "نكهة واحدة", two: "نكهتان", few: "نكهات", many: "نكهة" }, en: { one: "flavor", other: "flavors" } },
  packaging: { ar: { one: "عبوة واحدة", two: "عبوتان", few: "عبوات", many: "عبوة" }, en: { one: "pack", other: "packs" } },
  origin: { ar: { one: "منشأ واحد", two: "منشآن", few: "مناشئ", many: "منشأً" }, en: { one: "origin", other: "origins" } },
};

export const VARIANT_NOUN: NounForms = {
  ar: { one: "نوع واحد", two: "نوعان", few: "أنواع", many: "نوعًا" },
  en: { one: "variant", other: "variants" },
};

export const PRODUCT_NOUN: NounForms = {
  ar: { one: "منتج واحد", two: "منتجان", few: "منتجات", many: "منتجًا" },
  en: { one: "product", other: "products" },
};

/** Values of `option` used by at least one variant, in the option's own order. */
function usedValues(view: ProductVariantsView, option: OptionView): OptionValueView[] {
  return option.values.filter((v) => view.variants.some((variant) => variant.options[option.key] === v.key));
}

/**
 * Card line under the product name: «مقاسان: ٧ مم · ١٠ مم» (≤ 3 values) or «٤ قطعيات».
 * Uses the first option with 2+ used values; null for SIMPLE / single-variant products.
 */
export function variantSummaryLine(view: ProductVariantsView, locale: string): string | null {
  if (view.type !== "VARIANT" || view.variants.length < 2) return null;
  for (const option of view.options) {
    const values = usedValues(view, option);
    if (values.length < 2) continue;
    const count = pluralize(values.length, OPTION_NOUNS[option.key] ?? VARIANT_NOUN, locale);
    return values.length <= 3 ? `${count}: ${values.map((v) => v.label).join(" · ")}` : count;
  }
  return pluralize(view.variants.length, VARIANT_NOUN, locale);
}

/* ------------------------------------------------------------------------------------------------
 * Combinations
 * ---------------------------------------------------------------------------------------------- */

/** Stable identity of a combination, independent of option order: "size=7mm|weight=2.5kg". */
export function comboKey(options: Record<string, string>): string {
  return Object.keys(options)
    .sort()
    .map((k) => `${k}=${options[k]}`)
    .join("|");
}

/** Every combination of the options' values (cartesian product), in option/value order. */
export function generateCombinations(options: { key: string; valueKeys: string[] }[]): Record<string, string>[] {
  const active = options.filter((o) => o.valueKeys.length > 0);
  if (active.length === 0) return [];
  let combos: Record<string, string>[] = [{}];
  for (const option of active) {
    const next: Record<string, string>[] = [];
    for (const combo of combos) for (const value of option.valueKeys) next.push({ ...combo, [option.key]: value });
    combos = next;
  }
  return combos;
}

export type OrphanReason = "missing-option" | "unknown-option" | "unknown-value";

/**
 * Variants whose combination no longer fits the options (an option or value was removed, or a new
 * option was added that the variant has no value for). The admin flags these for review and never
 * deletes them without confirmation.
 */
export function findOrphans<V extends { options: Record<string, string> }>(
  options: { key: string; valueKeys: string[] }[],
  variants: V[]
): { variant: V; reason: OrphanReason }[] {
  const byKey = new Map(options.map((o) => [o.key, new Set(o.valueKeys)]));
  const orphans: { variant: V; reason: OrphanReason }[] = [];
  for (const variant of variants) {
    const keys = Object.keys(variant.options);
    if (keys.some((k) => !byKey.has(k))) orphans.push({ variant, reason: "unknown-option" });
    else if (keys.some((k) => !byKey.get(k)!.has(variant.options[k]))) orphans.push({ variant, reason: "unknown-value" });
    else if (options.some((o) => !(o.key in variant.options))) orphans.push({ variant, reason: "missing-option" });
  }
  return orphans;
}

/**
 * «توليد الأنواع»: keeps every existing variant (with its data) whose combination still exists,
 * appends a fresh variant for each missing combination, and reports orphans separately.
 */
export function mergeGeneratedCombinations<V extends { options: Record<string, string> }>(
  options: { key: string; valueKeys: string[] }[],
  existing: V[],
  create: (options: Record<string, string>) => V
): { variants: V[]; added: number; orphans: { variant: V; reason: OrphanReason }[] } {
  const orphans = findOrphans(options, existing);
  const orphanSet = new Set(orphans.map((o) => o.variant));
  const kept = existing.filter((v) => !orphanSet.has(v));
  const keptKeys = new Set(kept.map((v) => comboKey(v.options)));
  const added = generateCombinations(options)
    .filter((combo) => !keptKeys.has(comboKey(combo)))
    .map(create);
  return { variants: [...kept, ...orphans.map((o) => o.variant), ...added], added: added.length, orphans };
}

/* ------------------------------------------------------------------------------------------------
 * Selection (URL params <-> variant)
 * ---------------------------------------------------------------------------------------------- */

export type SearchParamsLike = Record<string, string | string[] | undefined> | URLSearchParams;

function param(params: SearchParamsLike, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  const v = params[key];
  return Array.isArray(v) ? v[0] : v;
}

export function findVariant(view: ProductVariantsView, id: string | null | undefined): VariantView | undefined {
  return id ? view.variants.find((v) => v.id === id) : undefined;
}

export function defaultVariant(view: ProductVariantsView): VariantView {
  return findVariant(view, view.defaultVariantId) ?? view.variants[0];
}

/**
 * The variant selected by URL params (`?cut=ribeye&weight=1kg`). Unknown option keys and values are
 * ignored; an exact match wins; otherwise the best variant that agrees with the valid params
 * (preferring the default, then available ones); with no valid params, the default variant.
 */
export function resolveVariantFromParams(view: ProductVariantsView, params: SearchParamsLike): VariantView {
  const fallback = defaultVariant(view);
  if (view.type !== "VARIANT" || view.options.length === 0) return fallback;
  const wanted: Record<string, string> = {};
  for (const option of view.options) {
    const value = param(params, option.key);
    if (value && option.values.some((v) => v.key === value)) wanted[option.key] = value;
  }
  const wantedKeys = Object.keys(wanted);
  if (wantedKeys.length === 0) return fallback;
  const matching = view.variants.filter((v) => wantedKeys.every((k) => v.options[k] === wanted[k]));
  if (matching.length === 0) return fallback;
  return matching.find((v) => v.id === fallback.id) ?? matching.find((v) => v.available) ?? matching[0];
}

/** URL query for a variant: "cut=ribeye&weight=1kg" in option order (empty for SIMPLE). */
export function variantQuery(view: ProductVariantsView, variant: VariantView): string {
  if (view.type !== "VARIANT") return "";
  const qs = new URLSearchParams();
  for (const option of view.options) {
    const value = variant.options[option.key];
    if (value) qs.set(option.key, value);
  }
  return qs.toString();
}

export type ValueState = "selected" | "enabled" | "disabled";

/**
 * Selector state for each value of `optionKey`, given the current variant. Options are treated
 * hierarchically (in display order): a value is enabled when some variant has it together with the
 * current values of all EARLIER options. The first option is therefore never blocked, so a visitor
 * can always reach every variant -- picking a value then lands on the best variant that has it.
 */
export function valueStates(view: ProductVariantsView, current: VariantView, optionKey: string): Record<string, ValueState> {
  const index = view.options.findIndex((o) => o.key === optionKey);
  const option = view.options[index];
  const states: Record<string, ValueState> = {};
  if (!option) return states;
  const earlier = view.options.slice(0, index).map((o) => o.key);
  for (const value of option.values) {
    if (current.options[optionKey] === value.key) states[value.key] = "selected";
    else {
      const exists = view.variants.some(
        (v) => v.options[optionKey] === value.key && earlier.every((k) => v.options[k] === current.options[k])
      );
      states[value.key] = exists ? "enabled" : "disabled";
    }
  }
  return states;
}

/**
 * The variant to show after picking `valueKey` for `optionKey`: keep the earlier options and as many
 * of the current later options as possible; fall back to any variant with the value.
 */
export function selectValue(view: ProductVariantsView, current: VariantView, optionKey: string, valueKey: string): VariantView {
  const index = view.options.findIndex((o) => o.key === optionKey);
  const earlier = view.options.slice(0, index).map((o) => o.key);
  const later = view.options.slice(index + 1).map((o) => o.key);
  const candidates = view.variants.filter(
    (v) => v.options[optionKey] === valueKey && earlier.every((k) => v.options[k] === current.options[k])
  );
  const pool = candidates.length ? candidates : view.variants.filter((v) => v.options[optionKey] === valueKey);
  if (pool.length === 0) return current;
  const score = (v: VariantView) => later.filter((k) => v.options[k] === current.options[k]).length * 2 + (v.available ? 1 : 0);
  return pool.reduce((best, v) => (score(v) > score(best) ? v : best), pool[0]);
}

/* ------------------------------------------------------------------------------------------------
 * Keys / labels
 * ---------------------------------------------------------------------------------------------- */

const AR_TO_LATIN_DIGITS: Record<string, string> = { "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9", "٫": "." };

/** URL-safe value/option key from a label: "2.5 kg" -> "2.5kg", "Rib Eye" -> "rib-eye". "" if nothing usable. */
export function slugifyKey(text: string): string {
  return text
    .replace(/[٠-٩٫]/g, (d) => AR_TO_LATIN_DIGITS[d] ?? d)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/(\d)\s+(?=[a-z])/g, "$1")
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 40);
}

/** "٧ مم · ٢٫٥ كجم" -- the variant's option labels in option order. */
export function combinationLabel(options: { key: string; values: { key: string; label: string }[] }[], selection: Record<string, string>): string {
  return options
    .map((o) => o.values.find((v) => v.key === selection[o.key])?.label)
    .filter(Boolean)
    .join(" · ");
}
