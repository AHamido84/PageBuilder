import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { BlockRenderProps } from "../../types";
import type { CategoryGridData, BrandGridData } from "../commerce-blocks";

export async function CategoryGridRender({ data, locale }: BlockRenderProps<CategoryGridData>) {
  const categories = await prisma.category.findMany({
    where: { isActive: true, ...(data.categoryIds?.length ? { id: { in: data.categoryIds } } : {}) },
    include: { translations: true, image: { select: { url: true } } },
    orderBy: { order: "asc" },
  });

  return (
    <div>
      {data.heading ? <h2 className="mb-6 font-display text-3xl">{data.heading}</h2> : null}
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        {categories.map((category) => {
          const name = category.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? category.slug;
          return (
            <Link key={category.id} href={`/${locale}/products?category=${category.slug}`} className="group block overflow-hidden rounded-[var(--radius-md)] border border-current/10">
              <div className="aspect-square bg-current/5">
                {category.image?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={category.image.url} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : null}
              </div>
              <p className="p-3 text-sm font-medium">{name}</p>
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
    include: { translations: true, logo: { select: { url: true } } },
  });

  return (
    <div>
      {data.heading ? <h2 className="mb-6 font-display text-3xl">{data.heading}</h2> : null}
      <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
        {brands.map((brand) => {
          const name = brand.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? brand.slug;
          return (
            <div key={brand.id} className="flex items-center justify-center">
              {brand.logo?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logo.url} alt={name} className="h-12 w-auto object-contain" />
              ) : (
                <span className="text-sm font-medium">{name}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
