import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/section";
import { TemperatureBadge } from "@/components/ui/badge";
import { BackArrow } from "@/components/ui/arrow";
import { ProductCard, type ProductCardData } from "@/components/site/product-card";
import { buttonClasses } from "@/components/ui/button";
import type { RichText } from "@/lib/text-style/rich-text";
import { InquiryForm } from "./inquiry-form";
import { VariantDescription, VariantDetails, VariantGallery, VariantProvider, VariantQuoteLink, VariantSelectorIsland, VariantTitle, VariantsTable } from "./variant-islands";
import { localizedOrigin, type ProductPageData } from "./product-data";

/**
 * The product page's sections (moved from page.tsx, markup unchanged). The built-in page renders
 * all three; the Page Builder product template renders the main one as its fixed «Product details»
 * block and «related products» as a block, with any other sections around them.
 */

export interface ProductPageContext {
  product: ProductPageData;
  initialVariantId: string;
  variantsEnabled: boolean;
  related: ProductCardData[];
  locale: string;
}

/** Gallery, certifications, documents, title, variant selector, quote link, specs and «الأنواع المتاحة». */
export async function ProductMainSection({ product, initialVariantId, variantsEnabled, locale }: ProductPageContext) {
  const t = await getTranslations({ locale, namespace: "productDetail" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const view = product.variants;

  // Variant-independent "additional info" rows (weight moved into VariantDetails).
  const additionalInfo = [
    { label: t("dimensions"), value: product.dimensions },
    { label: t("ingredients"), value: product.ingredients, rich: product.infoRich.ingredients },
    { label: t("nutritionInfo"), value: product.nutritionInfo, rich: product.infoRich.nutritionInfo },
    { label: t("allergens"), value: product.allergens, rich: product.infoRich.allergens },
  ].filter((row): row is { label: string; value: string; rich?: RichText } => Boolean(row.value));

  return (
    <VariantProvider view={view} initialVariantId={initialVariantId}>
      <Section tone="paper" className="border-t-0 pb-10 pt-10 sm:pb-12 sm:pt-14">
        <Link href={`/${locale}/products`} className="text-sm text-ink/50 hover:text-harbor">
          <BackArrow /> {tCommon("backToProducts")}
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Gallery */}
          <div>
            <VariantGallery videos={product.videos} mobileMainUrl={product.mobileImageUrl} />

            {product.certifications.length > 0 ? (
              <div className="mt-6">
                <p className="mb-2 text-sm font-medium">{t("certifications")}</p>
                <div className="flex flex-wrap gap-3">
                  {product.certifications.map((cert) => (
                    <div key={cert.id} className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-line px-3 py-2">
                      {cert.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cert.imageUrl} alt="" className="h-8 w-8 object-contain" />
                      ) : null}
                      <span className="text-xs font-medium">{cert.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {product.documents.length > 0 ? (
              <div className="mt-6">
                <p className="mb-2 text-sm font-medium">{t("documents")}</p>
                <ul className="space-y-1.5">
                  {product.documents.map((doc) => (
                    <li key={doc.id}>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm text-harbor underline hover:text-ink">
                        {doc.originalName}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Info */}
          <div>
            <p className="manifest-strip mb-2 text-harbor">{product.categoryName}</p>
            <VariantTitle productName={product.name} className="font-display text-3xl leading-[1.1] sm:text-4xl" />
            <VariantDescription />

            <VariantSelectorIsland labels={{ unavailableCombo: t("variantUnavailableCombo"), currentlyUnavailable: t("variantCurrentlyUnavailable") }} />
            {variantsEnabled ? (
              <VariantQuoteLink locale={locale} slug={product.slug} label={t("requestQuoteForProduct")} className={`${buttonClasses("primary", "md")} mt-7 min-h-11`} />
            ) : null}

            {/* Specifications + per-variant details */}
            <VariantDetails
              productSku={product.sku}
              labels={{
                specifications: t("specifications"),
                sku: t("sku"),
                weight: t("weight"),
                packaging: t("packaging"),
                storage: t("storage"),
                additionalInfo: t("additionalInfo"),
              }}
              fixedSpecRows={
                <>
                  <SpecRow label={t("category")} value={product.categoryName} />
                  {product.brandName ? <SpecRow label={t("brand")} value={product.brandName} /> : null}
                  <SpecRow label={t("temperatureClass")} value={<TemperatureBadge value={product.temperatureClass} locale={locale} />} />
                  {product.originCountry ? <SpecRow label={t("origin")} value={localizedOrigin(product.originCountry, locale)} /> : null}
                </>
              }
              extraInfoRows={additionalInfo}
            />
          </div>
        </div>

        <VariantsTable
          labels={{
            title: t("variantsTableTitle"),
            variant: t("variantsTableVariant"),
            sku: t("sku"),
            weight: t("weight"),
            packaging: t("packaging"),
            availability: t("variantsTableAvailability"),
            available: t("variantAvailable"),
            unavailable: t("variantCurrentlyUnavailable"),
            select: t("variantsTableSelect"),
            selected: t("variantsTableSelected"),
          }}
        />
      </Section>
    </VariantProvider>
  );
}

/** «تواصل معنا بخصوص هذا المنتج» (the built-in page's product inquiry form). */
export async function ProductInquirySection({ product, locale }: Pick<ProductPageContext, "product" | "locale">) {
  const t = await getTranslations({ locale, namespace: "productDetail" });
  return (
    <Section tone="frost" title={t("inquiryTitle")} description={t("inquiryBody")} containerClassName="max-w-3xl">
      <InquiryForm productId={product.id} productName={product.name} />
    </Section>
  );
}

/** Related products (curated, else the same category). Renders nothing without any. */
export async function ProductRelatedSection({ related, locale, title }: { related: ProductCardData[]; locale: string; title?: React.ReactNode }) {
  if (related.length === 0) return null;
  const t = await getTranslations({ locale, namespace: "productDetail" });
  return (
    <Section tone="paper" title={title ?? t("relatedProducts")}>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        {related.map((item) => (
          <ProductCard key={item.id} product={item} locale={locale} />
        ))}
      </div>
    </Section>
  );
}

function SpecRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 text-sm">
      <span className="text-ink/50">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
