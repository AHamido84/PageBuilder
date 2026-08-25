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

export async function CategoryGridRender({ data, locale }: BlockRenderProps<CategoryGridData>) {
  const categories = await prisma.category.findMany({
    where: { isActive: true, ...(data.categoryIds?.length ? { id: { in: data.categoryIds } } : {}) },
    include: { translations: true, image: { select: { url: true } } },
    orderBy: { order: "asc" },
  });

  return (
    <div>
      {data.heading ? <h2 className="mb-8 font-display text-3xl">{data.heading}</h2> : null}
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        {categories.map((category) => {
          const name = category.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? category.slug;
          const hasImage = Boolean(category.image?.url);
          return (
            <Link
              key={category.id}
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
        })}
      </div>
    </div>
  );
}

export async function BrandGridRender({ data, locale }: BlockRenderProps<BrandGridData>) {
  const brands = await prisma.brand.findMany({
    where: { isActive: true, ...(data.brandIds?.length ? { id: { in: data.brandIds } } : {}) },
    include: { translations: true, logo: { select: { url: true } }, _count: { select: { products: true } } },
  });

  return (
    <div>
      {data.heading ? <h2 className="mb-8 font-display text-3xl">{data.heading}</h2> : null}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {brands.map((brand) => {
          const name = brand.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? brand.slug;
          const count = brand._count.products;
          const hasLogo = Boolean(brand.logo?.url);
          return (
            <div
              key={brand.id}
              className="group bg-grid-fine relative flex aspect-square flex-col items-center justify-center gap-1 overflow-hidden rounded-[var(--radius-md)] border border-current/10 bg-paper p-4 text-center transition-colors duration-300 hover:border-current/25"
            >
              {hasLogo ? (
                <CmsFillImage
                  src={brand.logo!.url}
                  alt={name}
                  sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 33vw"
                  className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
                  context={{ mediaId: brand.logoId ?? undefined, component: "BRAND_GRID", locale }}
                />
              ) : (
                <p className="font-display text-base leading-tight transition-opacity duration-300 sm:text-lg">{name}</p>
              )}
              {count > 0 ? (
                <p className="font-mono-data absolute bottom-3 text-[11px] uppercase tracking-[0.1em] opacity-0 transition-opacity duration-300 group-hover:opacity-50">
                  {(locale === "ar" ? PRODUCT_COUNT_LABEL.ar : PRODUCT_COUNT_LABEL.en)(count)}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
