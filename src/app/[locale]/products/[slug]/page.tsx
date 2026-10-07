import { cache } from "react";
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
import { getProduct, getRelatedCards, redirectIfMoved, type ProductPageData } from "./product-data";
import { productCopy } from "@/lib/seo/page-copy";
import { normalizeBrandSpelling } from "@/lib/brand";
import { ProductInquirySection, ProductMainSection, ProductRelatedSection, type ProductPageContext } from "./product-sections";

export const dynamic = "force-dynamic";

/** One product load per request, shared by generateMetadata and the page. */
const loadProduct = cache(async (slug: string, locale: string) => {
  const [variantsEnabled, textStyles] = await Promise.all([areVariantsEnabled(), areTextStylesEnabled()]);
  return getProduct(slug, locale, variantsEnabled, textStyles);
});

/** The default variant (the one the page opens on): its weight/images speak for the product. */
function defaultVariant(product: ProductPageData) {
  const view = product.variants;
  return view.variants.find((v) => v.id === view.defaultVariantId) ?? view.variants[0];
}

/** The product's pack weight: its own field, else the one weight all its variants share (null when mixed). */
function sharedWeight(product: ProductPageData): string | null {
  if (product.weight?.trim()) return product.weight.trim();
  const weights = product.variants.variants.map((v) => v.weight?.trim()).filter((w): w is string => Boolean(w));
  if (!weights.length || new Set(weights.map((w) => w.replace(/\s+/g, ""))).size !== 1) return null;
  return weights[0];
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await loadProduct(slug, locale);
  if (!product) return {};
  const seo = await prisma.sEO.findUnique({ where: { productId: product.id }, include: { ogImage: { select: { url: true } } } });

  return buildMetadata({
    locale,
    // Always the canonical product path: ?size=7mm / ?variant=... never reach the canonical URL.
    path: `/products/${product.slug}`,
    seo,
    fallbackTitle: product.name,
    fallbackDescription: product.shortDescription ?? product.description ?? null,
    copy: productCopy(
      { name: product.name, weight: sharedWeight(product), categoryName: product.categoryName, brandName: product.brandName, temperatureClass: product.temperatureClass },
      locale
    ),
    image: defaultVariant(product)?.images[0]?.url ?? null,
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
  const tNav = await getTranslations("nav");
  const variantsEnabled = await areVariantsEnabled();
  const textStyles = await areTextStylesEnabled();

  const product = await loadProduct(slug, locale);
  if (!product) {
    await redirectIfMoved(slug, locale);
    notFound();
  }

  const related = await getRelatedCards(product, locale, variantsEnabled, textStyles);

  const view = product.variants;
  // Invalid/unknown params fall back to the default variant (resolveVariantFromParams).
  const initialVariant = resolveVariantFromParams(view, query);
  const productUrl = `${SITE_URL}/${locale}/products/${product.slug}`;
  const clean = (text: string) => normalizeBrandSpelling(text).replace(/\s+/g, " ").trim();
  const schemaName = clean(product.name);
  const schemaBrand = product.brandName ? clean(product.brandName) : null;
  const schemaCategory = product.categoryName ? clean(product.categoryName) : null;
  const schemaDescription = product.description ?? product.shortDescription ?? productCopy(
    { name: product.name, weight: sharedWeight(product), categoryName: product.categoryName, brandName: product.brandName, temperatureClass: product.temperatureClass },
    locale
  ).description;

  const structuredData = [
    view.type === "VARIANT"
      ? productGroupSchema({
          name: schemaName,
          description: schemaDescription,
          productGroupId: product.sku,
          brandName: schemaBrand,
          category: schemaCategory,
          // The canonical (query-less) URL identifies the group; each variant gets its own deep link.
          url: productUrl,
          variesBy: view.options.map((o) => o.key),
          variants: view.variants.map((v) => {
            const qs = variantQuery(view, v);
            return {
              name: clean(v.name),
              description: v.shortDescription ?? v.description,
              sku: v.sku,
              imageUrls: v.images.map((img) => img.url),
              url: qs ? `${productUrl}?${qs}` : productUrl,
              properties: view.options.map((o) => ({ name: o.label, value: o.values.find((val) => val.key === v.options[o.key])?.label ?? "" })),
            };
          }),
        })
      : productSchema({
          name: schemaName,
          description: schemaDescription,
          sku: product.sku,
          imageUrls: view.variants[0].images.map((img) => img.url),
          brandName: schemaBrand,
          category: schemaCategory,
          weight: sharedWeight(product),
          url: productUrl,
        }),
    breadcrumbSchema([
      { name: tNav("home"), url: `${SITE_URL}/${locale}` },
      { name: tNav("products"), url: `${SITE_URL}/${locale}/products` },
      ...(schemaCategory ? [{ name: schemaCategory, url: `${SITE_URL}/${locale}/products?category=${encodeURIComponent(product.categorySlug)}` }] : []),
      { name: schemaName, url: productUrl },
    ]),
  ];

  const variantInUrl = Boolean(query.variant) || view.options.some((o) => query[o.key] !== undefined);
  const context: ProductPageContext = { product, initialVariantId: initialVariant.id, variantsEnabled, related, locale };

  // The Page Builder product template (Admin -> Pages -> «قالب صفحة المنتج») when switched on and
  // published, or for an editor's ?preview=draft. Otherwise the built-in page below, unchanged.
  const draftPreview = await isDraftPreviewRequest(query);
  const template = await loadSystemPageSections(PRODUCT_TEMPLATE_SLUG, draftPreview);
  if (template) {
    return (
      <div>
        <JsonLd data={structuredData} />
        {/* The template's quote form preselects this product -- a specific variant only when the URL picks one. */}
        <QuotePrefillProvider product={product.slug} variant={variantInUrl ? initialVariant.id : null}>
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
