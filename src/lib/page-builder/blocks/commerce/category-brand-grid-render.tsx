import { prisma } from "@/lib/prisma";
import { CategoryCard, FeaturedCategoryCard, BrandCard, type CategoryWithRelations, type DisplayBrand } from "./category-brand-cards";
import type { BlockRenderProps } from "../../types";
import type { CategoryGridData, BrandGridData } from "../commerce-blocks";

const categoryWithRelationsInclude = {
  translations: true,
  image: { select: { url: true } },
  _count: { select: { products: true } },
} as const;

/** Dynamic-mode data source: categories the admin has marked Featured in Category Management,
 * ordered by featuredOrder -- falling back to the category's regular `order` for any category
 * without an explicit featuredOrder, per the "Dynamic Featured Categories" spec. */
async function loadFeaturedCategories(limit: number | undefined): Promise<CategoryWithRelations[]> {
  const rows = await prisma.category.findMany({
    where: { isActive: true, isFeatured: true },
    include: categoryWithRelationsInclude,
  });
  const sorted = rows.sort((a, b) => {
    const aKey = a.featuredOrder ?? a.order;
    const bKey = b.featuredOrder ?? b.order;
    if (aKey !== bKey) return aKey - bKey;
    return a.order - b.order;
  });
  return limit ? sorted.slice(0, limit) : sorted;
}

/** Manual mode: `categoryIds`' own array order IS the editor's chosen display order (reorderable
 * via the up/down controls in CategoryGridEdit) -- Prisma's `findMany` doesn't preserve `id: {in}`
 * input order, so the result is re-sorted in JS to match. Empty `categoryIds` (nothing hand-picked
 * yet) falls back to every active category in its regular admin `order`, same as before. */
async function loadManualCategories(categoryIds: string[], limit: number | undefined): Promise<CategoryWithRelations[]> {
  const rows = await prisma.category.findMany({
    where: { isActive: true, ...(categoryIds.length ? { id: { in: categoryIds } } : {}) },
    include: categoryWithRelationsInclude,
    orderBy: { order: "asc" },
  });
  const ordered = categoryIds.length
    ? categoryIds.map((id) => rows.find((r) => r.id === id)).filter((r): r is (typeof rows)[number] => Boolean(r))
    : rows;
  return limit ? ordered.slice(0, limit) : ordered;
}

export async function CategoryGridRender({ data, locale }: BlockRenderProps<CategoryGridData>) {
  const mode = data.mode ?? "dynamic";
  const layout = data.layout ?? "bento";
  const columns = data.columns ?? 4;
  const categories = mode === "manual" ? await loadManualCategories(data.categoryIds ?? [], data.limit) : await loadFeaturedCategories(data.limit);

  // Dynamic mode with nothing marked Featured: hide the section on the public site rather than
  // showing an empty/broken grid -- the admin-facing warning lives in CategoryGridPreview instead.
  if (mode === "dynamic" && categories.length === 0) return null;

  const cardProps = { showDescription: data.showDescription, showProductCount: data.showProductCount, showCta: data.showCta, ctaLabel: data.ctaLabel };
  const gridStyle = { "--cols": columns } as React.CSSProperties;
  const heading = data.heading ? <h2 className="mb-3 font-display text-h2">{data.heading}</h2> : null;
  const description = data.description ? <p className="measure-ar mb-8 max-w-2xl text-ink/60">{data.description}</p> : null;

  if (layout === "grid") {
    return (
      <div>
        {heading}
        {description}
        <div className="grid grid-cols-2 gap-[var(--grid-gap,1.25rem)] sm:grid-cols-[repeat(var(--cols),minmax(0,1fr))]" style={gridStyle}>
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} locale={locale} {...cardProps} />
          ))}
        </div>
      </div>
    );
  }

  const [featured, ...rest] = categories;

  return (
    <div>
      {heading}
      {description}
      {featured ? (
        <FeaturedCategoryCard category={featured} locale={locale} showProductCount={data.showProductCount} ctaLabel={data.ctaLabel} />
      ) : null}
      {/* Bento arrangement, not a uniform grid: the first remaining category gets a large 2x2 tile
          (per the brief's "avoid repetitive grid-only layouts" direction) so the section reads as
          curated rather than a repeating tile wall. */}
      <div className="grid auto-rows-[minmax(9rem,1fr)] grid-cols-2 gap-[var(--grid-gap,1.25rem)] sm:grid-cols-[repeat(var(--cols),minmax(0,1fr))]" style={gridStyle}>
        {rest.map((category, i) => (
          <CategoryCard key={category.id} category={category} locale={locale} large={i === 0} {...cardProps} />
        ))}
      </div>
    </div>
  );
}

/** Live query path (draft/admin canvas, or a pre-fix published revision with no frozen `resolvedBrands`).
 * Explicitly-selected brands are shown regardless of `isActive` -- an editor who hand-picked a brand
 * shouldn't have it silently vanish because someone deactivated it elsewhere; the `isActive` filter
 * only applies to the "show all brands" (nothing checked) mode. */
async function loadLiveBrands(brandIds: string[], locale: string): Promise<DisplayBrand[]> {
  const brands = await prisma.brand.findMany({
    where: brandIds.length ? { id: { in: brandIds } } : { isActive: true },
    include: { translations: true, logo: { select: { url: true } }, _count: { select: { products: true } } },
  });
  return brands.map((brand) => {
    const translation = brand.translations.find((t) => t.locale === locale.toUpperCase());
    return {
      id: brand.id,
      name: translation?.name ?? brand.slug,
      logoUrl: brand.logo?.url ?? null,
      logoId: brand.logoId,
      description: translation?.description ?? null,
      website: brand.website ?? null,
      count: brand._count.products,
    };
  });
}

/** Dynamic-mode data source: brands the admin has marked Featured in Brand Management, ordered by
 * `order` -- same pattern as loadFeaturedCategories in this file's Category half. */
export async function loadFeaturedBrands(locale: string, limit: number | undefined): Promise<DisplayBrand[]> {
  const brands = await prisma.brand.findMany({
    where: { isActive: true, isFeatured: true },
    orderBy: { order: "asc" },
    include: { translations: true, logo: { select: { url: true } }, _count: { select: { products: true } } },
    take: limit,
  });
  return brands.map((brand) => {
    const translation = brand.translations.find((t) => t.locale === locale.toUpperCase());
    return {
      id: brand.id,
      name: translation?.name ?? brand.slug,
      logoUrl: brand.logo?.url ?? null,
      logoId: brand.logoId,
      description: translation?.description ?? null,
      website: brand.website ?? null,
      count: brand._count.products,
    };
  });
}

export async function BrandGridRender({ data, locale }: BlockRenderProps<BrandGridData>) {
  const mode = data.mode ?? "dynamic";
  const brands: DisplayBrand[] = data.resolvedBrands
    ? data.resolvedBrands.map((b) => ({
        id: b.id,
        name: b.name,
        logoUrl: b.logoUrl,
        logoId: b.logoId,
        description: b.description ?? null,
        website: b.website ?? null,
        count: b.productCount,
      }))
    : mode === "manual"
      ? await loadLiveBrands(data.brandIds ?? [], locale)
      : await loadFeaturedBrands(locale, data.limit);

  // Dynamic mode with nothing marked Featured: hide the section on the public site rather than
  // showing an empty/broken grid -- same convention as CategoryGridRender above. Applies whether
  // `brands` came from a live query or a frozen (possibly empty) `resolvedBrands` snapshot.
  if (mode === "dynamic" && brands.length === 0) return null;

  return (
    <div>
      {data.heading ? <h2 className="mb-8 font-display text-h2">{data.heading}</h2> : null}
      <div className="grid grid-cols-2 gap-[var(--grid-gap,1.25rem)] sm:grid-cols-3 lg:grid-cols-5">
        {brands.map((brand) => (
          <BrandCard key={brand.id} brand={brand} locale={locale} showDescription={data.showDescription ?? true} />
        ))}
      </div>
    </div>
  );
}
