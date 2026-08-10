import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { Section } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/admin/ui/pagination";
import { ProductCard, type ProductCardData } from "@/components/site/product-card";
import { FilterBar } from "./filter-bar";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

interface ProductsPageProps {
  searchParams: Promise<{ q?: string; category?: string; brand?: string; temp?: string; sort?: string; page?: string }>;
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

async function getBrands(locale: string) {
  const brands = await prisma.brand.findMany({ where: { isActive: true }, orderBy: { slug: "asc" }, include: { translations: true } });
  return brands.map((b) => ({
    slug: b.slug,
    name: b.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? b.slug,
  }));
}

async function getProducts(
  locale: string,
  params: Awaited<ProductsPageProps["searchParams"]>
): Promise<{ items: ProductCardData[]; total: number }> {
  const where: Prisma.ProductWhereInput = { isPublished: true };

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
      include: { translations: true, category: { include: { translations: true } }, images: { take: 1, select: { url: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  let mapped: ProductCardData[] = products.map((product) => ({
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    temperatureClass: product.temperatureClass,
    name: product.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? product.sku,
    shortDescription: product.translations.find((t) => t.locale === locale.toUpperCase())?.shortDescription ?? null,
    categoryName: product.category.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? product.category.slug,
    imageUrl: product.images[0]?.url ?? null,
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
  const [categories, brands, { items: products, total }] = await Promise.all([getCategories(locale), getBrands(locale), getProducts(locale, params)]);

  const page = Math.max(1, Number(params.page) || 1);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function hrefForPage(p: number) {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.category) sp.set("category", params.category);
    if (params.brand) sp.set("brand", params.brand);
    if (params.temp) sp.set("temp", params.temp);
    if (params.sort) sp.set("sort", params.sort);
    sp.set("page", String(p));
    return `?${sp.toString()}`;
  }

  return (
    <Section tone="paper" eyebrow={t("eyebrow")} title={t("title")}>
      <FilterBar categories={categories} brands={brands} />
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
        <EmptyState title={t("empty")} />
      )}
    </Section>
  );
}
