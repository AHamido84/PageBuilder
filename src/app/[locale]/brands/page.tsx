import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

async function getBrands(locale: string) {
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { slug: "asc" },
    include: { translations: true, logo: { select: { url: true } }, _count: { select: { products: true } } },
  });

  return brands.map((brand) => ({
    id: brand.id,
    slug: brand.slug,
    name: brand.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? brand.slug,
    description: brand.translations.find((t) => t.locale === locale.toUpperCase())?.description ?? null,
    logoUrl: brand.logo?.url ?? null,
    productCount: brand._count.products,
  }));
}

export default async function BrandsPage() {
  const locale = await getLocale();
  const t = await getTranslations("brands");
  const tCommon = await getTranslations("common");
  const brands = await getBrands(locale);

  return (
    <Section tone="paper" eyebrow={t("eyebrow")} title={t("title")}>
      {brands.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Link key={brand.id} href={`/${locale}/brands/${brand.slug}`}>
              <Card className="flex h-full flex-col p-6">
                {brand.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={brand.logoUrl} alt={brand.name} className="mb-4 h-10 max-w-[140px] object-contain" />
                ) : null}
                <p className="font-display text-xl">{brand.name}</p>
                {brand.description ? <p className="mt-2 text-sm leading-relaxed text-ink/60">{brand.description}</p> : null}
                <p className="font-mono-data mt-auto pt-4 text-xs text-ink/40">{tCommon("skuCount", { count: brand.productCount })}</p>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title={t("title")} description={t("empty")} />
      )}
    </Section>
  );
}
