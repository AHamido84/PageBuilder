import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { Section } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/admin/ui/pagination";
import { ProductCard, type ProductCardData } from "@/components/site/product-card";
import { FilterBar } from "./filter-bar";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "products" });
  const tHome = await getTranslations({ locale, namespace: "home" });
  return buildMetadata({ locale, path: "/products", fallbackTitle: t("title"), fallbackDescription: tHome("heroSubtitle") });
}

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

async function getCategoryIntro(slug: string, locale: string) {
  const category = await prisma.category.findUnique({
    where: { slug, isActive: true },
    include: { translations: true },
  });
  if (!category) return null;
  const translation = category.translations.find((t) => t.locale === locale.toUpperCase());
  return { name: translation?.name ?? category.slug, description: translation?.description ?? null };
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
    isFeatured: product.isFeatured,
    createdAt: product.createdAt,
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
  const [categories, brands, { items: products, total }, activeCategory] = await Promise.all([
    getCategories(locale),
    getBrands(locale),
    getProducts(locale, params),
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
    sp.set("page", String(p));
    return `?${sp.toString()}`;
  }

  return (
    <Section
      tone="paper"
      eyebrow={activeCategory ? t("filterCategory") : t("eyebrow")}
      title={activeCategory ? activeCategory.name : t("title")}
      description={activeCategory?.description ?? undefined}
    >
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
