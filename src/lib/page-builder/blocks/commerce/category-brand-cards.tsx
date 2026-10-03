"use client";

import Link from "next/link";
import { Arrow } from "@/components/ui/arrow";
import { RouteLine } from "@/components/site/graphics/route-line";
import { CmsFillImage } from "@/components/media/cms-image";
import { IMAGE_ZOOM_CLASS, ScrollReveal } from "@/lib/motion/primitives";

/**
 * Phase 10: presentational card components for Category/Brand Grid, split out of
 * `category-brand-grid-render.tsx` into their own Client Component so they can reveal in place on
 * scroll (`ScrollReveal`, needs a client-side IntersectionObserver) while the grid-level Render
 * functions stay plain async Server Components doing their own Prisma queries -- standard Next.js
 * Server-renders-Client composition, the same split `ProductCard` already uses. Every className
 * string below is copied verbatim from the pre-split version -- `as={Link}`/`as="a"` on `ScrollReveal`
 * renders the SAME element in place (no extra wrapper div), so col-span/row-span/aspect-ratio
 * classes on the bento layout's large tile are completely unaffected.
 */

const CARD_ACCENT_PATH = "M4 32 Q 36 4 68 32";

const PRODUCT_COUNT_LABEL = {
  en: (count: number) => `${count} product${count === 1 ? "" : "s"}`,
  ar: (count: number) => `${count} ${count === 1 ? "منتج" : "منتجات"}`,
};
const FEATURED_CATEGORY_LABEL = { en: "Featured category", ar: "فئة مميزة" };
const SHOP_CATEGORY_LABEL = { en: "Shop now", ar: "تسوق الآن" };

export type CategoryWithRelations = {
  id: string;
  slug: string;
  imageId: string | null;
  translations: { locale: string; name: string; description: string | null }[];
  image: { url: string } | null;
  _count: { products: number };
};

/** "chips" layout: one pill link per category -- a light "discover our products" strip. */
export function CategoryChips({ categories, locale }: { categories: CategoryWithRelations[]; locale: string }) {
  return (
    <ScrollReveal variant="fade-up" className="flex flex-wrap gap-2.5">
      {categories.map((category) => {
        const name = category.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? category.slug;
        return (
          <Link
            key={category.id}
            href={`/${locale}/products?category=${category.slug}`}
            className="rounded-full border border-line-strong px-4 py-2 text-sm transition-colors hover:border-current hover:bg-ink hover:text-paper"
          >
            {name}
          </Link>
        );
      })}
    </ScrollReveal>
  );
}

/** The first category in the list, given the editorial full-width treatment (large image, name,
 * description, explicit CTA) so the section reads as curated rather than a repeating grid --
 * per the brief's "avoid repetitive grid-only layouts" direction. Everything after it stays in the
 * plain grid below, which is still the right call for categories 2-N: an editorial treatment on
 * every card would just be a slower-loading grid wearing a costume. */
export function FeaturedCategoryCard({
  category,
  locale,
  showProductCount,
  ctaLabel,
}: {
  category: CategoryWithRelations;
  locale: string;
  showProductCount?: boolean;
  ctaLabel?: string;
}) {
  const lang = locale === "ar" ? "ar" : "en";
  const translation = category.translations.find((t) => t.locale === locale.toUpperCase());
  const name = translation?.name ?? category.slug;
  const description = translation?.description ?? "";
  const hasImage = Boolean(category.image?.url);
  return (
    <ScrollReveal
      as={Link}
      href={`/${locale}/products?category=${category.slug}`}
      variant="fade-up"
      data-ui-card=""
      className="group relative mb-5 flex flex-col overflow-hidden rounded-[var(--card-radius)] border border-current/10 sm:flex-row"
    >
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden sm:aspect-auto sm:w-1/2">
        {hasImage ? (
          <CmsFillImage
            src={category.image!.url}
            alt=""
            sizes="(min-width: 640px) 50vw, 100vw"
            className={`object-cover ${IMAGE_ZOOM_CLASS}`}
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
        {showProductCount && category._count.products > 0 ? (
          <p className="font-mono-data text-xs uppercase tracking-[0.1em] text-ink/40">{(lang === "ar" ? PRODUCT_COUNT_LABEL.ar : PRODUCT_COUNT_LABEL.en)(category._count.products)}</p>
        ) : null}
        <span className="mt-2 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-harbor transition-transform duration-300 group-hover:translate-x-1">
          {ctaLabel || SHOP_CATEGORY_LABEL[lang]} <Arrow />
        </span>
      </div>
    </ScrollReveal>
  );
}

export function CategoryCard({
  category,
  locale,
  large = false,
  showDescription,
  showProductCount,
  showCta,
  ctaLabel,
}: {
  category: CategoryWithRelations;
  locale: string;
  large?: boolean;
  showDescription?: boolean;
  showProductCount?: boolean;
  showCta?: boolean;
  ctaLabel?: string;
}) {
  const lang = locale === "ar" ? "ar" : "en";
  const translation = category.translations.find((t) => t.locale === locale.toUpperCase());
  const name = translation?.name ?? category.slug;
  const description = translation?.description ?? "";
  const hasImage = Boolean(category.image?.url);
  return (
    <ScrollReveal
      as={Link}
      href={`/${locale}/products?category=${category.slug}`}
      variant="fade-up"
      data-ui-card=""
      className={`group relative block overflow-hidden rounded-[var(--card-radius-lg)] border border-current/10 ${large ? "col-span-2 row-span-2 aspect-[4/5] sm:aspect-auto" : "aspect-[4/5]"}`}
    >
      {hasImage ? (
        <>
          <CmsFillImage
            src={category.image!.url}
            alt=""
            sizes={large ? "(min-width: 640px) 50vw, 100vw" : "(min-width: 640px) 25vw, 50vw"}
            className={`object-cover ${IMAGE_ZOOM_CLASS}`}
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
      <div className={`absolute inset-x-0 bottom-0 flex flex-col gap-1.5 ${large ? "p-6 sm:p-8" : "p-4"} ${hasImage ? "text-paper" : "text-ink"}`}>
        <div className="flex items-end justify-between gap-2">
          <p className={`font-display leading-tight transition-transform duration-300 group-hover:-translate-y-0.5 ${large ? "text-2xl sm:text-h3" : "text-lg"}`}>{name}</p>
          {!showCta ? (
            <span className="inline-block shrink-0 pb-0.5 opacity-70 transition-transform duration-300 group-hover:translate-x-1">
              <Arrow />
            </span>
          ) : null}
        </div>
        {showDescription && description ? <p className={`line-clamp-2 max-w-md text-sm leading-relaxed ${hasImage ? "text-paper/75" : "text-ink/60"}`}>{description}</p> : null}
        {showProductCount && category._count.products > 0 ? (
          <p className={`font-mono-data text-[11px] uppercase tracking-[0.1em] ${hasImage ? "text-paper/60" : "text-ink/45"}`}>
            {(lang === "ar" ? PRODUCT_COUNT_LABEL.ar : PRODUCT_COUNT_LABEL.en)(category._count.products)}
          </p>
        ) : null}
        {showCta ? (
          <span className="inline-flex w-fit items-center gap-1.5 text-sm font-medium transition-transform duration-300 group-hover:translate-x-1">
            {ctaLabel || SHOP_CATEGORY_LABEL[lang]} <Arrow />
          </span>
        ) : null}
      </div>
    </ScrollReveal>
  );
}

export interface DisplayBrand {
  id: string;
  name: string;
  logoUrl: string | null;
  logoId: string | null;
  description: string | null;
  website: string | null;
  count: number;
}

/** Brand card: Logo/Image, Brand Name, Description (if available), Link (if available) -- in that
 * order, per the Phase 6 redesign brief. Name is always shown (previously only shown as a fallback
 * when a brand had no logo, which silently hid a required field on every brand that had one). */
export function BrandCard({ brand, locale, showDescription }: { brand: DisplayBrand; locale: string; showDescription?: boolean }) {
  const hasLogo = Boolean(brand.logoUrl);
  const description = showDescription ? brand.description : null;
  const body = (
    <>
      {/* `.bg-grid-fine` bakes its own low opacity into the whole element it's applied to (see
          globals.css) -- it must stay on its own decorative layer, never on the container that
          also holds the real logo/text, or the actual content gets washed out along with the
          background pattern. This was the root cause of brand logos rendering at ~6% opacity
          ("look disabled"). Kept as a sibling here, scoped to just the logo frame, not the card. */}
      <div className="relative h-16 w-full shrink-0 sm:h-20">
        {hasLogo ? (
          <CmsFillImage
            src={brand.logoUrl!}
            alt={brand.name}
            sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 33vw"
            className={`object-contain ${IMAGE_ZOOM_CLASS}`}
            context={{ mediaId: brand.logoId ?? undefined, component: "BRAND_GRID", locale }}
          />
        ) : (
          <div aria-hidden className="bg-grid-fine absolute inset-0 rounded-[var(--radius-md)]" />
        )}
      </div>
      <p className="relative mt-3 line-clamp-1 font-display text-sm leading-tight text-ink sm:text-base">{brand.name}</p>
      {description ? <p className="relative mt-1 line-clamp-2 max-w-[16rem] text-xs leading-relaxed text-ink/60">{description}</p> : null}
      {brand.count > 0 ? (
        <p className="font-mono-data relative mt-1 text-[11px] uppercase tracking-[0.1em] text-ink/40">
          {(locale === "ar" ? PRODUCT_COUNT_LABEL.ar : PRODUCT_COUNT_LABEL.en)(brand.count)}
        </p>
      ) : null}
    </>
  );
  const className =
    "hover-lift group relative flex min-h-[9rem] flex-col items-center justify-center gap-0 overflow-hidden rounded-[var(--card-radius-lg)] border border-current/10 bg-paper p-6 text-center";
  if (brand.website) {
    return (
      <ScrollReveal as="a" href={brand.website} target="_blank" rel="noreferrer" variant="fade-up" className={className} data-ui-card="">
        {body}
      </ScrollReveal>
    );
  }
  return (
    <ScrollReveal variant="fade-up" className={className} data-ui-card="">
      {body}
    </ScrollReveal>
  );
}
