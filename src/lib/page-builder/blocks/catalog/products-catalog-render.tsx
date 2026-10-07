import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClasses } from "@/components/ui/button";
import { Pagination } from "@/components/admin/ui/pagination";
import { ProductCard } from "@/components/site/product-card";
import { StyledText } from "@/components/text/styled-text";
import { FilterBar } from "@/app/[locale]/products/filter-bar";
import { richOf } from "@/lib/text-style/rich-text";
import { areVariantsEnabled, loadOptionFilters, optionFilterSelection } from "@/lib/catalog/variants/load";
import { getCategoryIntro, getListingBrands, getListingCategories, getListingProducts } from "@/lib/catalog/products-listing";
import { FILTER_KEYS, listingQuery, pageHref, parseListingParams } from "@/lib/catalog/products-listing-params";
import { withPromo } from "../commerce/grid-promo-card";
import type { BlockRenderProps } from "../../types";
import type { ProductsCatalogData } from "../catalog-blocks";

const COLS_MOBILE: Record<number, string> = { 1: "grid-cols-1", 2: "grid-cols-2" };
const COLS_TABLET: Record<number, string> = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" };
const COLS_DESKTOP: Record<number, string> = { 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5", 6: "lg:grid-cols-6" };

/**
 * PRODUCTS_CATALOG -- the /products listing as a Page Builder block: the same query, filters, cards,
 * pagination and empty states as the built-in page (src/lib/catalog/products-listing.ts), with its
 * header, columns, filters, paging, quote card and texts editable. URL-synced like before
 * (?q=&category=&brand=&temp=&sort=&page= + option filters, + &show= for «load more»).
 * Default settings render exactly the built-in page's markup.
 */
export async function ProductsCatalogRender({ data, locale, context, pageHeading }: BlockRenderProps<ProductsCatalogData>) {
  const t = await getTranslations({ locale, namespace: "products" });
  const searchParams = context?.searchParams ?? {};
  const pageSize = data.pageSize ?? 12;
  const params = parseListingParams(searchParams, { pageSize, defaultCategory: data.defaultCategory || null });
  const variantsEnabled = await areVariantsEnabled();
  const optionFilters = variantsEnabled ? await loadOptionFilters(locale, params.category ?? undefined) : [];
  const optionSelection = optionFilterSelection(optionFilters, searchParams);
  const filters = data.filters ?? [...FILTER_KEYS];
  const classicFilters = filters.length === FILTER_KEYS.length && filters.every((k, i) => k === FILTER_KEYS[i]);

  const [categories, brands, { items: products, total }, activeCategory] = await Promise.all([
    getListingCategories(locale),
    getListingBrands(locale),
    getListingProducts(locale, params, variantsEnabled, optionSelection, { pageSize, paging: data.paging, variantCards: data.variantCards }),
    params.category && params.categoryFromUrl && data.categoryHeader !== false ? getCategoryIntro(params.category, locale) : Promise.resolve(null),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const loadMore = data.paging === "loadMore";
  const grid = [COLS_MOBILE[data.columnsMobile ?? 2], COLS_TABLET[data.columnsTablet ?? 3], COLS_DESKTOP[data.columnsDesktop ?? 4]].join(" ");
  const styled = (key: "emptyText" | "emptyCategoryText" | "emptyCategoryAction" | "loadMoreLabel", fallback: string) =>
    data[key] ? <StyledText text={data[key]} rich={richOf(data, key)} /> : fallback;
  const cards = withPromo(
    products.map((product) => <ProductCard key={product.id} product={product} locale={locale} />),
    data.quoteCard,
    locale
  );

  const results = (
    <>
      {filters.length > 0 ? <FilterBar categories={categories} brands={brands} optionFilters={optionFilters} filters={classicFilters ? undefined : filters} /> : null}
      {data.showResultsCount !== false ? <p className="font-mono-data mb-6 text-xs text-ink/40">{t("resultsCount", { count: total })}</p> : null}
      {products.length > 0 ? (
        <>
          <div className={`grid ${grid} gap-5`} data-products-grid>
            {cards}
          </div>
          {loadMore ? (
            products.length < total ? (
              <div className="mt-10 flex justify-center">
                <Link href={listingQuery(params, optionSelection, { show: params.show + pageSize, page: null }) || "?"} scroll={false} className={buttonClasses("secondary", "md")} data-load-more>
                  {styled("loadMoreLabel", locale === "ar" ? "عرض المزيد" : "Load more")}
                </Link>
              </div>
            ) : null
          ) : (
            <Pagination page={params.page} totalPages={totalPages} hrefForPage={(p) => pageHref(params, optionSelection, p)} variant="light" />
          )}
        </>
      ) : params.category ? (
        // A category with nothing in it yet: say so and offer a quote (visual audit finding 10).
        <EmptyState
          title={styled("emptyCategoryText", t("emptyCategory"))}
          action={
            <Link href={`/${locale}#quote-form`} className={buttonClasses("primary", "md")}>
              {styled("emptyCategoryAction", t("emptyCategoryAction"))}
            </Link>
          }
        />
      ) : (
        <EmptyState title={styled("emptyText", t("empty"))} />
      )}
    </>
  );

  // A category filter shows that category's own translated name/description as the header --
  // dynamic, per-category SEO-relevant content, as on the built-in page.
  if (activeCategory?.bannerUrl) {
    return (
      <>
        <div className="relative overflow-hidden bg-ink text-paper" data-category-banner>
          {/* eslint-disable-next-line @next/next/no-img-element -- admin-uploaded banner of unknown aspect ratio */}
          <img src={activeCategory.bannerUrl} alt={activeCategory.name} className="absolute inset-0 h-full w-full object-cover opacity-45" />
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
      <Section titleAs={pageHeading ?? "h1"} tone="paper" eyebrow={t("filterCategory")} title={activeCategory.name} description={activeCategory.description ?? undefined}>
        {results}
      </Section>
    );
  }

  return (
    <Section
      titleAs={pageHeading ?? "h2"}
      tone="paper"
      eyebrow={data.eyebrow ? <StyledText text={data.eyebrow} rich={richOf(data, "eyebrow")} /> : undefined}
      title={data.title ? <StyledText text={data.title} rich={richOf(data, "title")} /> : undefined}
      description={data.subtitle ? <StyledText text={data.subtitle} rich={richOf(data, "subtitle")} /> : undefined}
    >
      {results}
    </Section>
  );
}
