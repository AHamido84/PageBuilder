import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCard, type ProductCardData } from "@/components/site/product-card";

export const dynamic = "force-dynamic";

export default async function BrandDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("brands");
  const upperLocale = locale.toUpperCase();

  const brand = await prisma.brand.findUnique({
    where: { slug },
    include: { translations: true, logo: { select: { url: true } } },
  });

  if (!brand || !brand.isActive) notFound();

  const name = brand.translations.find((tr) => tr.locale === upperLocale)?.name ?? brand.slug;
  const description = brand.translations.find((tr) => tr.locale === upperLocale)?.description ?? null;

  const products = await prisma.product.findMany({
    where: { brandId: brand.id, isPublished: true },
    include: { translations: true, category: { include: { translations: true } }, images: { take: 1, select: { url: true } } },
  });

  const productCards: ProductCardData[] = products.map((product) => ({
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    temperatureClass: product.temperatureClass,
    name: product.translations.find((tr) => tr.locale === upperLocale)?.name ?? product.sku,
    categoryName: product.category.translations.find((tr) => tr.locale === upperLocale)?.name ?? product.category.slug,
    imageUrl: product.images[0]?.url ?? null,
  }));

  return (
    <div>
      <Section tone="paper" className="border-t-0">
        <div className="flex items-center gap-6">
          {brand.logo?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo.url} alt={name} className="h-14 max-w-[180px] object-contain" />
          ) : null}
          <div>
            <h1 className="font-display text-3xl sm:text-4xl">{name}</h1>
            {description ? <p className="mt-2 max-w-xl text-ink/65">{description}</p> : null}
          </div>
        </div>
      </Section>
      <Section tone="frost" title={t("productsFrom") + " " + name}>
        {productCards.length > 0 ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {productCards.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        ) : (
          <EmptyState title={t("productsFrom") + " " + name} description={t("empty")} />
        )}
      </Section>
    </div>
  );
}
