import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { Section } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCard, type ProductCardData } from "@/components/site/product-card";
import { FilterBar } from "./filter-bar";

export const dynamic = "force-dynamic";

interface ProductsPageProps {
  searchParams: Promise<{ q?: string; category?: string; temp?: string; sort?: string }>;
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

async function getProducts(locale: string, params: Awaited<ProductsPageProps["searchParams"]>): Promise<ProductCardData[]> {
  const where: Prisma.ProductWhereInput = { isPublished: true };

  if (params.category) {
    where.category = { slug: params.category };
  }
  if (params.temp && ["FROZEN", "CHILLED", "AMBIENT"].includes(params.temp)) {
    where.temperatureClass = params.temp as "FROZEN" | "CHILLED" | "AMBIENT";
  }
  if (params.q) {
    where.translations = { some: { name: { contains: params.q, mode: "insensitive" } } };
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    params.sort === "name-asc" || params.sort === "name-desc" ? { sku: params.sort === "name-asc" ? "asc" : "desc" } : { createdAt: "desc" };

  const products = await prisma.product.findMany({
    where,
    orderBy,
    include: { translations: true, category: { include: { translations: true } }, images: { take: 1, select: { url: true } } },
  });

  let mapped: ProductCardData[] = products.map((product) => ({
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    temperatureClass: product.temperatureClass,
    name: product.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? product.sku,
    categoryName: product.category.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? product.category.slug,
    imageUrl: product.images[0]?.url ?? null,
  }));

  if (params.sort === "name-asc" || params.sort === "name-desc") {
    mapped = mapped.sort((a, b) => (params.sort === "name-asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
  }

  return mapped;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations("products");
  const [categories, products] = await Promise.all([getCategories(locale), getProducts(locale, params)]);

  return (
    <Section tone="paper" eyebrow={t("eyebrow")} title={t("title")}>
      <FilterBar categories={categories} />
      <p className="font-mono-data mb-6 text-xs text-ink/40">{t("resultsCount", { count: products.length })}</p>
      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} />
          ))}
        </div>
      ) : (
        <EmptyState title={t("empty")} />
      )}
    </Section>
  );
}
