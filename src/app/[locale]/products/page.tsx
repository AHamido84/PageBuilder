import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClasses } from "@/components/ui/button";
import { Pagination } from "@/components/admin/ui/pagination";
import { ProductCard, type ProductCardData } from "@/components/site/product-card";
import { FilterBar } from "./filter-bar";
import { buildMetadata } from "@/lib/seo/metadata";
import { SectionRenderer } from "@/components/site/section-renderer";
import { loadPageHeaderSections, loadPageHeaderMeta } from "@/lib/page-builder/page-headers";
import { isDraftPreviewRequest } from "@/lib/page-builder/render-page";
import { DraftPreviewBanner } from "@/components/site/draft-preview-banner";
import { productCardImageInclude, resolveProductCardImage } from "@/lib/catalog/product-image";
import { pageTitle } from "@/lib/page-builder/page-title";
import { areTextStylesEnabled } from "@/lib/text-style/flag";
import { areVariantsEnabled, cardTextFields, cardVariantFields, loadOptionFilters, optionFilterSelection, optionFilterWhere, variantGraphInclude } from "@/lib/catalog/variants/load";
import type { ProductVariantsView } from "@/lib/catalog/variants/core";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { category: categorySlug } = await searchParams;
  const t = await getTranslations({ locale, namespace: "products" });
  const tHome = await getTranslations({ locale, namespace: "home" });
  // PHASE 7: a category listing uses that category's own SEO record (editable in admin), falling
  // back to its translated name/description.
  if (categorySlug) {
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug, isActive: true },
      include: { translations: true, seo: { include: { ogImage: { select: { url: true } } } } },
    });
    if (category) {
      const translation = category.translations.find((tr) => tr.locale === locale.toUpperCase());
      return buildMetadata({
        locale,
        path: `/products?category=${encodeURIComponent(category.slug)}`,
        seo: category.seo,
        fallbackTitle: translation?.name ?? category.slug,
        fallbackDescription: translation?.description ?? null,
      });
    }
  }
  const header = await loadPageHeaderMeta("products");
  return buildMetadata({ locale, path: "/products", seo: header?.seo, fallbackTitle: pageTitle(header, locale) ?? t("title"), fallbackDescription: tHome("heroSubtitle") });
}

const PAGE_SIZE = 12;

interface ProductsPageProps {
  /** Known filters, plus any variant option filters (?size=7mm) -- see src/lib/catalog/variants/load.ts. */
  searchParams: Promise<{ q?: string; category?: string; brand?: string; temp?: string; sort?: string; page?: string } & Record<string, string | string[] | undefined>>;
}

async function getCategories(locale: string) {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    include: { translations: true },
  });
  return categories.map((c) => ({
    slug: c.slug,
    name: c.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? c.slug,
  }));
}

async function getCategoryIntro(slug: string, locale: string) {
  const category = await prisma.category.findUnique({
    where: { slug, isActive: true },
    include: { translations: true, banner: { select: { url: true } } },
  });
  if (!category) return null;
  const translation = category.translations.find((t) => t.locale === locale.toUpperCase());
  return { name: translation?.name ?? category.slug, description: translation?.description ?? null, bannerUrl: category.banner?.url ?? null };
}

async function getBrands(locale: string) {
  const brands = await prisma.brand.findMany({ where: { isActive: true }, orderBy: [{ order: "asc" }, { slug: "asc" }], include: { translations: true } });
  return brands.map((b) => ({
    slug: b.slug,
    name: b.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? b.slug,
  }));
}

async function getProducts(
  locale: string,
  params: Awaited<ProductsPageProps["searchParams"]>,
  variantsEnabled: boolean,
  optionSelection: Record<string, string>
): Promise<{ items: ProductCardData[]; total: number }> {
  const where: Prisma.ProductWhereInput = { isPublished: true, ...optionFilterWhere(optionSelection) };

  if (params.category) {
    where.category = { slug: params.category };
  }
  if (params.brand) {
    where.brand = { slug: params.brand };
  }
  if (params.temp && ["FROZEN", "CHILLED", "AMBIENT"].includes(params.temp)) {
    where.temperatureClass = params.temp as "FROZEN" | "CHILLED" | "AMBIENT";
  }
  if (params.q) {
    where.translations = { some: { name: { contains: params.q, mode: "insensitive" } } };
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    params.sort === "name-asc" || params.sort === "name-desc" ? { sku: params.sort === "name-asc" ? "asc" : "desc" } : { createdAt: "desc" };

  const page = Math.max(1, Number(params.page) || 1);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        translations: true,
        category: { include: { translations: true } },
        ...productCardImageInclude,
        ...variantGraphInclude,
      },
    }),
    prisma.product.count({ where }),
  ]);

  const textStyles = await areTextStylesEnabled();
  // With option filters active, each card shows the variant that matched them.
  const matching = (view: ProductVariantsView) =>
    Object.keys(optionSelection).length ? view.variants.find((v) => Object.entries(optionSelection).every(([k, val]) => v.options[k] === val)) : undefined;

  let mapped: ProductCardData[] = products.map((product) => ({
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    temperatureClass: product.temperatureClass,
    name: product.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? product.sku,
    shortDescription: product.translations.find((t) => t.locale === locale.toUpperCase())?.shortDescription ?? null,
    categoryName: product.category.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? product.category.slug,
    ...resolveProductCardImage(product),
    isFeatured: product.isFeatured,
    createdAt: product.createdAt,
    ...cardTextFields(product, locale, textStyles),
    ...cardVariantFields(product, locale, variantsEnabled, matching),
  }));

  if (params.sort === "name-asc" || params.sort === "name-desc") {
    mapped = mapped.sort((a, b) => (params.sort === "name-asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
  }

  return { items: mapped, total };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations("products");
  const variantsEnabled = await areVariantsEnabled();
  const optionFilters = variantsEnabled ? await loadOptionFilters(locale, params.category) : [];
  const optionSelection = optionFilterSelection(optionFilters, params);
  const [categories, brands, { items: products, total }, activeCategory] = await Promise.all([
    getCategories(locale),
    getBrands(locale),
    getProducts(locale, params, variantsEnabled, optionSelection),
    params.category ? getCategoryIntro(params.category, locale) : Promise.resolve(null),
  ]);

  const page = Math.max(1, Number(params.page) || 1);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function hrefForPage(p: number) {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.category) sp.set("category", params.category);
    if (params.brand) sp.set("brand", params.brand);
    if (params.temp) sp.set("temp", params.temp);
    if (params.sort) sp.set("sort", params.sort);
    for (const [key, value] of Object.entries(optionSelection)) sp.set(key, value);
    sp.set("page", String(p));
    return `?${sp.toString()}`;
  }

  const results = (
    <>
      <FilterBar categories={categories} brands={brands} optionFilters={optionFilters} />
      <p className="font-mono-data mb-6 text-xs text-ink/40">{t("resultsCount", { count: total })}</p>
      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} hrefForPage={hrefForPage} variant="light" />
        </>
      ) : (
        params.category ? (
          // A category with nothing in it yet: say so and offer a quote (visual audit finding 10).
          <EmptyState
            title={t("emptyCategory")}
            action={
              <Link href={`/${locale}#quote-form`} className={buttonClasses("primary", "md")}>
                {t("emptyCategoryAction")}
              </Link>
            }
          />
        ) : (
          <EmptyState title={t("empty")} />
        )
      )}
    </>
  );

  // A category filter shows that category's own translated name/description as the header --
  // dynamic, per-category SEO-relevant content, deliberately never replaced by the generic
  // editable header below.
  if (activeCategory?.bannerUrl) {
    // PHASE 7: a category with a banner gets a full-width image header (same treatment as a
    // brand's banner on /brands/[slug]); without one, the plain header below is unchanged.
    return (
      <>
        <div className="relative overflow-hidden bg-ink text-paper" data-category-banner>
          {/* eslint-disable-next-line @next/next/no-img-element -- admin-uploaded banner of unknown aspect ratio */}
          <img src={activeCategory.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/20" />
          <Container className="relative py-16 sm:py-24">
            <p className="manifest-strip mb-4 opacity-70">{t("filterCategory")}</p>
            <h1 className="font-display text-hero">{activeCategory.name}</h1>
            {activeCategory.description ? <p className="measure-ar mt-5 max-w-2xl text-lg leading-relaxed opacity-80">{activeCategory.description}</p> : null}
          </Container>
        </div>
        <Section tone="paper">{results}</Section>
      </>
    );
  }

  if (activeCategory) {
    return (
      <Section tone="paper" eyebrow={t("filterCategory")} title={activeCategory.name} description={activeCategory.description ?? undefined}>
        {results}
      </Section>
    );
  }

  // Phase 7: the page's own generic header/intro is now a real, admin-editable Page Builder
  // section (see src/lib/page-builder/page-headers.ts) -- falls back to the exact original
  // hardcoded text if the one-time seed script hasn't been run in this environment yet, so the
  // page never renders with a missing header.
  const draftPreview = await isDraftPreviewRequest(params);
  const headerSections = await loadPageHeaderSections("products", draftPreview);
  if (!headerSections) {
    return (
      <Section tone="paper" eyebrow={t("eyebrow")} title={t("title")}>
        {results}
      </Section>
    );
  }

  return (
    <>
      <SectionRenderer sections={headerSections} locale={locale} />
      {draftPreview ? <DraftPreviewBanner /> : null}
      <Section tone="paper">{results}</Section>
    </>
  );
}
