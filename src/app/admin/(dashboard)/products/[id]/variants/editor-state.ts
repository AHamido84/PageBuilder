import {
  combinationLabel,
  comboKey,
  findOrphans,
  type OptionDisplay,
  type OrphanReason,
  type ProductVariantsView,
} from "@/lib/catalog/variants/core";
import type { SaveVariantsInput } from "@/lib/catalog/variants/schema";

/** Client-side state of the variants editor (both languages at once). Strings are "" when empty. */

export interface EditorValue {
  uid: string;
  /** DB id once saved. */
  id: string | null;
  key: string;
  /** False until the admin edits the key by hand -- until then it follows the English value. */
  keyTouched: boolean;
  valueAr: string;
  valueEn: string;
  swatchHex: string;
  imageUrl: string;
}

export interface EditorOption {
  optionTypeId: string;
  key: string;
  labelAr: string;
  labelEn: string;
  display: OptionDisplay;
  values: EditorValue[];
}

export interface EditorImage {
  uid: string;
  url: string;
  mediaId: string | null;
  altAr: string;
  altEn: string;
}

export interface EditorSpec {
  uid: string;
  labelAr: string;
  labelEn: string;
  valueAr: string;
  valueEn: string;
}

export interface EditorVariant {
  clientId: string;
  id: string | null;
  /** optionKey -> valueKey */
  options: Record<string, string>;
  sku: string;
  nameAr: string;
  nameEn: string;
  weightAr: string;
  weightEn: string;
  packagingAr: string;
  packagingEn: string;
  storageAr: string;
  storageEn: string;
  available: boolean;
  images: EditorImage[];
  specs: EditorSpec[];
}

export interface EditorState {
  type: "SIMPLE" | "VARIANT";
  options: EditorOption[];
  variants: EditorVariant[];
  defaultClientId: string | null;
}

/** What a SIMPLE product shows today -- the seed for its first variant when it becomes a variant product. */
export interface LegacyFields {
  images: { url: string; mediaId: string | null }[];
  weight: string;
  packagingAr: string;
  packagingEn: string;
  storageAr: string;
  storageEn: string;
}

let counter = 0;
export function uid(prefix = "n"): string {
  counter += 1;
  return `${prefix}${Date.now().toString(36)}${counter.toString(36)}`;
}

export function emptyVariant(options: Record<string, string> = {}): EditorVariant {
  return {
    clientId: uid("v"),
    id: null,
    options,
    sku: "",
    nameAr: "",
    nameEn: "",
    weightAr: "",
    weightEn: "",
    packagingAr: "",
    packagingEn: "",
    storageAr: "",
    storageEn: "",
    available: true,
    images: [],
    specs: [],
  };
}

export function variantFromLegacy(legacy: LegacyFields): EditorVariant {
  return {
    ...emptyVariant(),
    weightAr: legacy.weight,
    weightEn: legacy.weight,
    packagingAr: legacy.packagingAr,
    packagingEn: legacy.packagingEn,
    storageAr: legacy.storageAr,
    storageEn: legacy.storageEn,
    images: legacy.images.map((img) => ({ uid: uid("i"), url: img.url, mediaId: img.mediaId, altAr: "", altEn: "" })),
  };
}

export const optionShape = (options: EditorOption[]) => options.map((o) => ({ key: o.key, valueKeys: o.values.map((v) => v.key) }));

/** Combination label in Arabic: «٧ مم · ٢٫٥ كجم». */
export function arLabel(options: EditorOption[], selection: Record<string, string>): string {
  return combinationLabel(
    options.map((o) => ({ key: o.key, values: o.values.map((v) => ({ key: v.key, label: v.valueAr || v.valueEn || v.key })) })),
    selection
  );
}

export const ORPHAN_TEXT: Record<OrphanReason | "duplicate", string> = {
  "missing-option": "ينقصه اختيار قيمة لخيار جديد",
  "unknown-option": "يستخدم خيارًا تم حذفه",
  "unknown-value": "يستخدم قيمة تم حذفها",
  duplicate: "تركيبة مكررة مع نوع آخر",
};

/** Variants needing review: orphans (see core.findOrphans) plus duplicate combinations. */
export function reviewIssues(state: EditorState): Map<string, OrphanReason | "duplicate"> {
  const issues = new Map<string, OrphanReason | "duplicate">();
  if (state.type !== "VARIANT") return issues;
  for (const { variant, reason } of findOrphans(optionShape(state.options), state.variants)) issues.set(variant.clientId, reason);
  const seen = new Map<string, string>();
  for (const v of state.variants) {
    if (issues.has(v.clientId)) continue;
    const key = comboKey(v.options);
    if (seen.has(key)) issues.set(v.clientId, "duplicate");
    else seen.set(key, v.clientId);
  }
  return issues;
}

export function toPayload(productId: string, state: EditorState, publish: boolean | undefined): SaveVariantsInput & { publish?: boolean } {
  if (state.type === "SIMPLE") return { productId, type: "SIMPLE", options: [], variants: [], defaultVariantClientId: null, ...(publish === undefined ? {} : { publish }) };
  return {
    productId,
    type: "VARIANT",
    ...(publish === undefined ? {} : { publish }),
    defaultVariantClientId: state.defaultClientId,
    options: state.options.map((o) => ({
      optionTypeId: o.optionTypeId,
      key: o.key,
      values: o.values.map((v) => ({ id: v.id, key: v.key, valueAr: v.valueAr, valueEn: v.valueEn, swatchHex: v.swatchHex || null, imageUrl: v.imageUrl || null })),
    })),
    variants: state.variants.map((v) => ({
      id: v.id,
      clientId: v.clientId,
      options: v.options,
      sku: v.sku || null,
      nameAr: v.nameAr || null,
      nameEn: v.nameEn || null,
      weightAr: v.weightAr || null,
      weightEn: v.weightEn || null,
      packagingAr: v.packagingAr || null,
      packagingEn: v.packagingEn || null,
      storageAr: v.storageAr || null,
      storageEn: v.storageEn || null,
      available: v.available,
      images: v.images.map((img) => ({ url: img.url, mediaId: img.mediaId, altAr: img.altAr || null, altEn: img.altEn || null })),
      specs: v.specs.map(({ labelAr, labelEn, valueAr, valueEn }) => ({ labelAr, labelEn, valueAr, valueEn })),
    })),
  };
}

/** The editor state as the public site would see it (Arabic), for the live preview. */
export function toPreviewView(state: EditorState, productNameAr: string, legacy: LegacyFields): ProductVariantsView {
  const legacyImages = legacy.images.map((i) => ({ url: i.url, alt: productNameAr }));
  if (state.type === "SIMPLE" || state.variants.length === 0) {
    return {
      type: "SIMPLE",
      options: [],
      variants: [{ id: "simple", sku: null, name: productNameAr, label: "", options: {}, images: legacyImages, weight: legacy.weight || null, packaging: legacy.packagingAr || null, storage: legacy.storageAr || null, specs: [], available: true }],
      defaultVariantId: "simple",
    };
  }
  const options = state.options.map((o) => ({
    key: o.key,
    label: o.labelAr,
    display: o.display,
    values: o.values.map((v) => ({ key: v.key, label: v.valueAr || v.valueEn || v.key, swatchHex: v.swatchHex || null, imageUrl: v.imageUrl || null })),
  }));
  const variants = state.variants.map((v) => {
    const label = combinationLabel(options, v.options);
    return {
      id: v.clientId,
      sku: v.sku || null,
      name: v.nameAr || (label ? `${productNameAr} — ${label}` : productNameAr),
      label,
      options: v.options,
      images: v.images.length ? v.images.map((i) => ({ url: i.url, alt: productNameAr })) : legacyImages,
      weight: v.weightAr || legacy.weight || null,
      packaging: v.packagingAr || legacy.packagingAr || null,
      storage: v.storageAr || legacy.storageAr || null,
      specs: v.specs.map((s) => ({ label: s.labelAr, value: s.valueAr })),
      available: v.available,
    };
  });
  const defaultId = variants.some((v) => v.id === state.defaultClientId) ? state.defaultClientId! : variants[0].id;
  return { type: "VARIANT", options, variants, defaultVariantId: defaultId };
}
