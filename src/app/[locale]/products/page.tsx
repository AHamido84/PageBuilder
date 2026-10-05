import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClasses } from "@/components/ui/button";
import { Pagination } from "@/components/admin/ui/pagination";
import { ProductCard } from "@/components/site/product-card";
import { FilterBar } from "./filter-bar";
import { buildMetadata } from "@/lib/seo/metadata";
import { SectionRenderer } from "@/components/site/section-renderer";
import { loadPageHeaderSections, loadPageHeaderMeta } from "@/lib/page-builder/page-headers";
import { isDraftPreviewRequest } from "@/lib/page-builder/render-page";
import { DraftPreviewBanner } from "@/components/site/draft-preview-banner";
import { pageTitle } from "@/lib/page-builder/page-title";
import { areVariantsEnabled, loadOptionFilters, optionFilterSelection } from "@/lib/catalog/variants/load";
import { getCategoryIntro, getListingBrands, getListingCategories, getListingProducts } from "@/lib/catalog/products-listing";
import { pageHref, parseListingParams } from "@/lib/catalog/products-listing-params";
import { loadSystemPageMeta, loadSystemPageSections } from "@/lib/page-builder/system-pages-server";
import { PRODUCTS_PAGE_SLUG } from "@/lib/page-builder/system-pages";

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
  // The Page Builder products page (when switched on and published) has its own title/SEO.
  const system = await loadSystemPageMeta(PRODUCTS_PAGE_SLUG);
  if (system) return buildMetadata({ locale, path: "/products", seo: system.seo, fallbackTitle: pageTitle(system, locale) ?? t("title"), fallbackDescription: tHome("heroSubtitle") });
  const header = await loadPageHeaderMeta("products");
  return buildMetadata({ locale, path: "/products", seo: header?.seo, fallbackTitle: pageTitle(header, locale) ?? t("title"), fallbackDescription: tHome("heroSubtitle") });
}

const PAGE_SIZE = 12;

interface ProductsPageProps {
  /** Known filters, plus any variant option filters (?size=7mm) -- see src/lib/catalog/variants/load.ts. */
  searchParams: Promise<{ q?: string; category?: string; brand?: string; temp?: string; sort?: string; page?: string } & Record<string, string | string[] | undefined>>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const locale = await getLocale();
  const draftPreview = await isDraftPreviewRequest(params);

  // The Page Builder products page (Admin -> Pages -> «المنتجات») when switched on and published,
  // or for an editor's ?preview=draft. Otherwise the built-in page below, unchanged.
  const system = await loadSystemPageSections(PRODUCTS_PAGE_SLUG, draftPreview);
  if (system) {
    return (
      <>
        <SectionRenderer sections={system.sections} locale={locale} context={{ searchParams: params }} />
        {system.draft ? <DraftPreviewBanner /> : null}
      </>
    );
  }

  const t = await getTranslations("products");
  const variantsEnabled = await areVariantsEnabled();
  const listing = parseListingParams(params, { pageSize: PAGE_SIZE });
  const optionFilters = variantsEnabled ? await loadOptionFilters(locale, params.category) : [];
  const optionSelection = optionFilterSelection(optionFilters, params);
  const [categories, brands, { items: products, total }, activeCategory] = await Promise.all([
    getListingCategories(locale),
    getListingBrands(locale),
    getListingProducts(locale, listing, variantsEnabled, optionSelection, { pageSize: PAGE_SIZE }),
    params.category ? getCategoryIntro(params.category, locale) : Promise.resolve(null),
  ]);

  const page = listing.page;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hrefForPage = (p: number) => pageHref(listing, optionSelection, p);

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
