import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { buildMetadata, SITE_URL } from "@/lib/seo/metadata";
import { productSchema, productGroupSchema, breadcrumbSchema } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/site/json-ld";
import { areVariantsEnabled } from "@/lib/catalog/variants/load";
import { resolveVariantFromParams, variantQuery } from "@/lib/catalog/variants/core";
import { areTextStylesEnabled } from "@/lib/text-style/flag";
import { SectionRenderer } from "@/components/site/section-renderer";
import { DraftPreviewBanner } from "@/components/site/draft-preview-banner";
import { isDraftPreviewRequest } from "@/lib/page-builder/render-page";
import { loadSystemPageSections } from "@/lib/page-builder/system-pages-server";
import { PRODUCT_TEMPLATE_SLUG } from "@/lib/page-builder/system-pages";
import { QuotePrefillProvider } from "@/lib/page-builder/blocks/golden/quote-prefill";
import { getProduct, getRelatedCards, redirectIfMoved } from "./product-data";
import { ProductInquirySection, ProductMainSection, ProductRelatedSection, type ProductPageContext } from "./product-sections";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { translations: true, seo: { include: { ogImage: { select: { url: true } } } } },
  });
  if (!product || !product.isPublished) return {};

  const upperLocale = locale.toUpperCase();
  const translation = product.translations.find((t) => t.locale === upperLocale) ?? product.translations[0];

  return buildMetadata({
    locale,
    path: `/products/${slug}`,
    seo: product.seo,
    fallbackTitle: translation?.name ?? product.sku,
    fallbackDescription: translation?.shortDescription ?? translation?.description ?? null,
  });
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const locale = await getLocale();
  const tCommon = await getTranslations("common");
  const variantsEnabled = await areVariantsEnabled();
  const textStyles = await areTextStylesEnabled();

  const product = await getProduct(slug, locale, variantsEnabled, textStyles);
  if (!product) {
    await redirectIfMoved(slug, locale);
    notFound();
  }

  const related = await getRelatedCards(product, locale, variantsEnabled, textStyles);

  const view = product.variants;
  // Invalid/unknown params fall back to the default variant (resolveVariantFromParams).
  const initialVariant = resolveVariantFromParams(view, query);
  const productUrl = `${SITE_URL}/${locale}/products/${product.slug}`;

  const structuredData = [
    view.type === "VARIANT"
      ? productGroupSchema({
          name: product.name,
          description: product.shortDescription ?? product.description,
          productGroupId: product.sku,
          brandName: product.brandName,
          // The canonical (query-less) URL identifies the group; each variant gets its own deep link.
          url: productUrl,
          variesBy: view.options.map((o) => o.key),
          variants: view.variants.map((v) => {
            const qs = variantQuery(view, v);
            return {
              name: v.name,
              description: v.shortDescription ?? v.description,
              sku: v.sku,
              imageUrls: v.images.map((img) => img.url),
              url: qs ? `${productUrl}?${qs}` : productUrl,
              properties: view.options.map((o) => ({ name: o.label, value: o.values.find((val) => val.key === v.options[o.key])?.label ?? "" })),
            };
          }),
        })
      : productSchema({
          name: product.name,
          description: product.shortDescription ?? product.description,
          sku: product.sku,
          imageUrls: view.variants[0].images.map((img) => img.url),
          brandName: product.brandName,
          url: productUrl,
          isAvailable: true,
        }),
    breadcrumbSchema([
      { name: "Home", url: `${SITE_URL}/${locale}` },
      { name: tCommon("backToProducts"), url: `${SITE_URL}/${locale}/products` },
      { name: product.name, url: productUrl },
    ]),
  ];

  const context: ProductPageContext = { product, initialVariantId: initialVariant.id, variantsEnabled, related, locale };

  // The Page Builder product template (Admin -> Pages -> «قالب صفحة المنتج») when switched on and
  // published, or for an editor's ?preview=draft. Otherwise the built-in page below, unchanged.
  const draftPreview = await isDraftPreviewRequest(query);
  const template = await loadSystemPageSections(PRODUCT_TEMPLATE_SLUG, draftPreview);
  if (template) {
    return (
      <div>
        <JsonLd data={structuredData} />
        {/* The template's quote form preselects this product (and the variant in the URL). */}
        <QuotePrefillProvider product={product.slug} variant={initialVariant.id}>
          <SectionRenderer sections={template.sections} locale={locale} context={{ searchParams: query, product: context }} />
        </QuotePrefillProvider>
        {template.draft ? <DraftPreviewBanner /> : null}
      </div>
    );
  }

  return (
    <div>
      <JsonLd data={structuredData} />
      <ProductMainSection {...context} />

      {/* Inquiry */}
      <ProductInquirySection product={product} locale={locale} />

      {/* Related */}
      <ProductRelatedSection related={related} locale={locale} />
    </div>
  );
}
