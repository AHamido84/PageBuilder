import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Arrow } from "@/components/ui/arrow";
import { RouteLine } from "@/components/site/graphics/route-line";
import { CmsFillImage } from "@/components/media/cms-image";
import type { BlockRenderProps } from "../../types";
import type { CategoryGridData, BrandGridData } from "../commerce-blocks";

/** A small arch — the recurring card accent used wherever a real photo isn't set yet. */
const CARD_ACCENT_PATH = "M4 32 Q 36 4 68 32";

/** Page Builder block chrome uses a small inline EN/AR dictionary rather than useTranslations, since Render runs both on the public site and inside the admin's client-rendered canvas. */
const PRODUCT_COUNT_LABEL = {
  en: (count: number) => `${count} product${count === 1 ? "" : "s"}`,
  ar: (count: number) => `${count} ${count === 1 ? "منتج" : "منتجات"}`,
};
const FEATURED_CATEGORY_LABEL = { en: "Featured category", ar: "فئة مميزة" };
const SHOP_CATEGORY_LABEL = { en: "Shop now", ar: "تسوق الآن" };

type CategoryWithRelations = {
  id: string;
  slug: string;
  imageId: string | null;
  translations: { locale: string; name: string; description: string | null }[];
  image: { url: string } | null;
};

/** The first category in the list, given the editorial full-width treatment (large image, name,
 * description, explicit CTA) so the section reads as curated rather than a repeating grid --
 * per the brief's "avoid repetitive grid-only layouts" direction. Everything after it stays in the
 * plain grid below, which is still the right call for categories 2-N: an editorial treatment on
 * every card would just be a slower-loading grid wearing a costume. */
function FeaturedCategoryCard({ category, locale }: { category: CategoryWithRelations; locale: string }) {
  const lang = locale === "ar" ? "ar" : "en";
  const translation = category.translations.find((t) => t.locale === locale.toUpperCase());
  const name = translation?.name ?? category.slug;
  const description = translation?.description ?? "";
  const hasImage = Boolean(category.image?.url);
  return (
    <Link
      href={`/${locale}/products?category=${category.slug}`}
      className="group relative mb-5 flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-current/10 sm:flex-row"
    >
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden sm:aspect-auto sm:w-1/2">
        {hasImage ? (
          <CmsFillImage
            src={category.image!.url}
            alt=""
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            context={{ mediaId: category.imageId ?? undefined, component: "CATEGORY_GRID", locale }}
          />
        ) : (
          <>
            <div className="bg-grid-fine absolute inset-0 bg-frost" />
            <RouteLine d={CARD_ACCENT_PATH} viewBox="0 0 72 36" strokeWidth={1.5} className="absolute start-6 top-6 h-10 w-20 text-harbor/50" />
          </>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-center gap-3 bg-paper p-8 sm:p-10 lg:p-12">
        <span className="manifest-strip text-wheat-strong">{FEATURED_CATEGORY_LABEL[lang]}</span>
        <p className="font-display text-h2 leading-tight text-ink">{name}</p>
        {description ? <p className="measure-ar max-w-md text-sm leading-relaxed text-ink/60">{description}</p> : null}
        <span className="mt-2 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-harbor transition-transform duration-300 group-hover:translate-x-1">
          {SHOP_CATEGORY_LABEL[lang]} <Arrow />
        </span>
      </div>
    </Link>
  );
}

function CategoryCard({ category, locale }: { category: CategoryWithRelations; locale: string }) {
  const name = category.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? category.slug;
  const hasImage = Boolean(category.image?.url);
  return (
    <Link
      href={`/${locale}/products?category=${category.slug}`}
      className="group relative block aspect-[4/5] overflow-hidden rounded-[var(--radius-md)] border border-current/10"
    >
      {hasImage ? (
        <>
          <CmsFillImage
            src={category.image!.url}
            alt=""
            sizes="(min-width: 640px) 25vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            context={{ mediaId: category.imageId ?? undefined, component: "CATEGORY_GRID", locale }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
        </>
      ) : (
        <div className="bg-grid-fine absolute inset-0 bg-frost" />
      )}
      {!hasImage ? (
        <RouteLine
          d={CARD_ACCENT_PATH}
          viewBox="0 0 72 36"
          strokeWidth={1.5}
          className="absolute start-4 top-4 h-9 w-[4.5rem] text-harbor/50"
        />
      ) : null}
      <div className={`absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 ${hasImage ? "text-paper" : "text-ink"}`}>
        <p className="font-display text-lg leading-tight transition-transform duration-300 group-hover:-translate-y-0.5">{name}</p>
        <span className="inline-block shrink-0 pb-0.5 opacity-70 transition-transform duration-300 group-hover:translate-x-1">
          <Arrow />
        </span>
      </div>
    </Link>
  );
}

/** Dynamic-mode data source: categories the admin has marked Featured in Category Management,
 * ordered by featuredOrder -- falling back to the category's regular `order` for any category
 * without an explicit featuredOrder, per the "Dynamic Featured Categories" spec. */
async function loadFeaturedCategories(limit: number | undefined): Promise<CategoryWithRelations[]> {
  const rows = await prisma.category.findMany({
    where: { isActive: true, isFeatured: true },
    include: { translations: true, image: { select: { url: true } } },
  });
  const sorted = rows.sort((a, b) => {
    const aKey = a.featuredOrder ?? a.order;
    const bKey = b.featuredOrder ?? b.order;
    if (aKey !== bKey) return aKey - bKey;
    return a.order - b.order;
  });
  return limit ? sorted.slice(0, limit) : sorted;
}

export async function CategoryGridRender({ data, locale }: BlockRenderProps<CategoryGridData>) {
  const mode = data.mode ?? "dynamic";
  const categories =
    mode === "manual"
      ? await prisma.category.findMany({
          where: { isActive: true, ...(data.categoryIds?.length ? { id: { in: data.categoryIds } } : {}) },
          include: { translations: true, image: { select: { url: true } } },
          orderBy: { order: "asc" },
        })
      : await loadFeaturedCategories(data.limit);

  // Dynamic mode with nothing marked Featured: hide the section on the public site rather than
  // showing an empty/broken grid -- the admin-facing warning lives in CategoryGridPreview instead.
  if (mode === "dynamic" && categories.length === 0) return null;

  const [featured, ...rest] = categories;

  return (
    <div>
      {data.heading ? <h2 className="mb-8 font-display text-3xl">{data.heading}</h2> : null}
      {featured ? <FeaturedCategoryCard category={featured} locale={locale} /> : null}
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        {rest.map((category) => (
          <CategoryCard key={category.id} category={category} locale={locale} />
        ))}
      </div>
    </div>
  );
}

interface DisplayBrand {
  id: string;
  name: string;
  logoUrl: string | null;
  logoId: string | null;
  count: number;
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
  return brands.map((brand) => ({
    id: brand.id,
    name: brand.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? brand.slug,
    logoUrl: brand.logo?.url ?? null,
    logoId: brand.logoId,
    count: brand._count.products,
  }));
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
  return brands.map((brand) => ({
    id: brand.id,
    name: brand.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? brand.slug,
    logoUrl: brand.logo?.url ?? null,
    logoId: brand.logoId,
    count: brand._count.products,
  }));
}

export async function BrandGridRender({ data, locale }: BlockRenderProps<BrandGridData>) {
  const mode = data.mode ?? "dynamic";
  const brands: DisplayBrand[] = data.resolvedBrands
    ? data.resolvedBrands.map((b) => ({ id: b.id, name: b.name, logoUrl: b.logoUrl, logoId: b.logoId, count: b.productCount }))
    : mode === "manual"
      ? await loadLiveBrands(data.brandIds ?? [], locale)
      : await loadFeaturedBrands(locale, data.limit);

  // Dynamic mode with nothing marked Featured: hide the section on the public site rather than
  // showing an empty/broken grid -- same convention as CategoryGridRender above. Applies whether
  // `brands` came from a live query or a frozen (possibly empty) `resolvedBrands` snapshot.
  if (mode === "dynamic" && brands.length === 0) return null;

  return (
    <div>
      {data.heading ? <h2 className="mb-8 font-display text-3xl">{data.heading}</h2> : null}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {brands.map((brand) => {
          const hasLogo = Boolean(brand.logoUrl);
          return (
            <div
              key={brand.id}
              className="group relative flex aspect-square flex-col items-center justify-center gap-1 overflow-hidden rounded-[var(--radius-md)] border border-current/10 bg-paper p-4 text-center transition-colors duration-300 hover:border-current/25"
            >
              {/* `.bg-grid-fine` bakes its own low opacity into the whole element it's applied to
                  (see globals.css) -- it must stay on its own decorative layer, never on the
                  container that also holds the real logo/text, or the actual content gets washed
                  out along with the background pattern. This was the root cause of brand logos
                  rendering at ~6% opacity ("look disabled"). */}
              <div aria-hidden className="bg-grid-fine pointer-events-none absolute inset-0" />
              {hasLogo ? (
                <CmsFillImage
                  src={brand.logoUrl!}
                  alt={brand.name}
                  sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 33vw"
                  className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
                  context={{ mediaId: brand.logoId ?? undefined, component: "BRAND_GRID", locale }}
                />
              ) : (
                <p className="relative font-display text-base leading-tight transition-opacity duration-300 sm:text-lg">{brand.name}</p>
              )}
              {brand.count > 0 ? (
                <p className="font-mono-data absolute bottom-3 text-[11px] uppercase tracking-[0.1em] opacity-0 transition-opacity duration-300 group-hover:opacity-50">
                  {(locale === "ar" ? PRODUCT_COUNT_LABEL.ar : PRODUCT_COUNT_LABEL.en)(brand.count)}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
