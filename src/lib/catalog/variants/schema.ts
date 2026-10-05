import { z } from "zod";
import { comboKey } from "./core";

/**
 * Server-side validation for the admin variants editor save (one payload = the product's whole
 * option/variant graph). Only the fields listed here are ever written -- unknown keys are stripped,
 * so the payload can't mass-assign anything else. Messages are Arabic and carry a `path` the editor
 * maps back to the offending field.
 */

const text = (max: number) => z.string().trim().max(max, `النص أطول من ${max} حرفًا`);
const optionalText = (max: number) => text(max).optional().nullable().transform((v) => (v ? v : null));
const key = z
  .string()
  .trim()
  .min(1, "المفتاح مطلوب")
  .max(40, "المفتاح طويل جدًا")
  .regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/, "المفتاح: حروف إنجليزية صغيرة وأرقام و - فقط");
const hex = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "لون غير صالح")
  .optional()
  .nullable()
  .transform((v) => v || null);
const imageUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => /^https:\/\//.test(v) || v.startsWith("/"), "رابط صورة غير صالح");

export const optionDisplaySchema = z.enum(["PILL", "SWATCH", "IMAGE", "SELECT"]);

export const optionValueInput = z.object({
  id: z.string().max(64).optional().nullable(),
  key,
  valueAr: text(80).min(1, "القيمة بالعربية مطلوبة"),
  valueEn: text(80).min(1, "القيمة بالإنجليزية مطلوبة"),
  swatchHex: hex,
  imageUrl: imageUrl.optional().nullable().transform((v) => v || null),
});

export const productOptionInput = z.object({
  optionTypeId: z.string().min(1).max(64),
  /** The option type's key -- variants reference options by it. */
  key,
  values: z.array(optionValueInput).max(50, "قيم كثيرة جدًا لهذا الخيار"),
});

export const variantImageInput = z.object({
  url: imageUrl,
  mediaId: z.string().max(64).optional().nullable().transform((v) => v || null),
  altAr: optionalText(200),
  altEn: optionalText(200),
});

export const variantSpecInput = z.object({
  labelAr: text(80).min(1, "عنوان المواصفة بالعربية مطلوب"),
  labelEn: text(80).min(1, "عنوان المواصفة بالإنجليزية مطلوب"),
  valueAr: text(200).min(1, "قيمة المواصفة بالعربية مطلوبة"),
  valueEn: text(200).min(1, "قيمة المواصفة بالإنجليزية مطلوبة"),
});

export const variantInput = z.object({
  /** DB id of an existing variant (kept stable across saves); absent for new rows. */
  id: z.string().max(64).optional().nullable(),
  /** Editor-side id, used to point `defaultVariantClientId` at a not-yet-saved row. */
  clientId: z.string().min(1).max(64),
  options: z.record(z.string(), z.string()),
  sku: optionalText(64),
  nameAr: optionalText(200),
  nameEn: optionalText(200),
  weightAr: optionalText(80),
  weightEn: optionalText(80),
  packagingAr: optionalText(300),
  packagingEn: optionalText(300),
  storageAr: optionalText(300),
  storageEn: optionalText(300),
  available: z.boolean(),
  images: z.array(variantImageInput).max(20, "صور كثيرة جدًا"),
  specs: z.array(variantSpecInput).max(30, "مواصفات كثيرة جدًا"),
});

export const saveVariantsInput = z
  .object({
    productId: z.string().min(1).max(64),
    type: z.enum(["SIMPLE", "VARIANT"]),
    publish: z.boolean().optional(),
    options: z.array(productOptionInput).max(6, "الحد الأقصى ٦ خيارات"),
    variants: z.array(variantInput).max(200, "الحد الأقصى ٢٠٠ نوع"),
    defaultVariantClientId: z.string().max(64).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "SIMPLE") {
      // A SIMPLE product renders from its own fields; the editor sends no options/variants for it.
      if (data.options.length > 0) ctx.addIssue({ code: "custom", path: ["options"], message: "المنتج البسيط لا يحتوي على خيارات" });
      return;
    }

    if (data.options.length === 0) ctx.addIssue({ code: "custom", path: ["options"], message: "أضف خيارًا واحدًا على الأقل" });
    const optionKeys = new Set<string>();
    data.options.forEach((option, i) => {
      if (optionKeys.has(option.key)) ctx.addIssue({ code: "custom", path: ["options", i], message: "هذا الخيار مضاف مرتين" });
      optionKeys.add(option.key);
      if (option.values.length === 0) ctx.addIssue({ code: "custom", path: ["options", i, "values"], message: "أضف قيمة واحدة على الأقل" });
      const valueKeys = new Set<string>();
      option.values.forEach((value, j) => {
        if (valueKeys.has(value.key)) ctx.addIssue({ code: "custom", path: ["options", i, "values", j, "key"], message: "قيمة مكررة في هذا الخيار" });
        valueKeys.add(value.key);
      });
    });

    if (data.variants.length === 0) ctx.addIssue({ code: "custom", path: ["variants"], message: "أضف نوعًا واحدًا على الأقل" });
    const combos = new Map<string, number>();
    const skus = new Map<string, number>();
    data.variants.forEach((variant, i) => {
      for (const option of data.options) {
        const valueKey = variant.options[option.key];
        if (!valueKey) ctx.addIssue({ code: "custom", path: ["variants", i, "options", option.key], message: "اختر قيمة لهذا الخيار" });
        else if (!option.values.some((v) => v.key === valueKey))
          ctx.addIssue({ code: "custom", path: ["variants", i, "options", option.key], message: "قيمة غير موجودة في الخيار" });
      }
      for (const k of Object.keys(variant.options)) {
        if (!optionKeys.has(k)) ctx.addIssue({ code: "custom", path: ["variants", i, "options", k], message: "خيار غير موجود — راجع هذا النوع" });
      }
      const combo = comboKey(variant.options);
      if (combos.has(combo)) ctx.addIssue({ code: "custom", path: ["variants", i, "options"], message: "هذه التركيبة مكررة" });
      combos.set(combo, i);
      if (variant.images.length === 0) ctx.addIssue({ code: "custom", path: ["variants", i, "images"], message: "أضف صورة واحدة على الأقل" });
      if (variant.sku) {
        if (skus.has(variant.sku)) ctx.addIssue({ code: "custom", path: ["variants", i, "sku"], message: "رمز SKU مكرر" });
        skus.set(variant.sku, i);
      }
    });

    if (!data.defaultVariantClientId || !data.variants.some((v) => v.clientId === data.defaultVariantClientId)) {
      ctx.addIssue({ code: "custom", path: ["defaultVariantClientId"], message: "حدد النوع الافتراضي" });
    }
  });

export type SaveVariantsInput = z.infer<typeof saveVariantsInput>;
export type VariantInput = z.infer<typeof variantInput>;

/** Flattens zod issues into { "variants.2.images": "أضف صورة واحدة على الأقل", ... } (first message per path). */
export function issuesToFieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const path = issue.path.map(String).join(".") || "_";
    errors[path] ??= issue.message;
  }
  return errors;
}

/* ------------------------------------------------------------------------------------------------ */

export const optionTypeInput = z.object({
  id: z.string().max(64).optional().nullable(),
  key,
  labelAr: text(60).min(1, "الاسم بالعربية مطلوب"),
  labelEn: text(60).min(1, "الاسم بالإنجليزية مطلوب"),
  display: optionDisplaySchema,
});
