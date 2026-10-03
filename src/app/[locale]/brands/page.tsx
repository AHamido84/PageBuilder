import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { buildMetadata } from "@/lib/seo/metadata";
import { SectionRenderer } from "@/components/site/section-renderer";
import { loadPageHeaderSections, loadPageHeaderMeta } from "@/lib/page-builder/page-headers";
import { isDraftPreviewRequest } from "@/lib/page-builder/render-page";
import { DraftPreviewBanner } from "@/components/site/draft-preview-banner";
import { pageTitle } from "@/lib/page-builder/page-title";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "brands" });
  const header = await loadPageHeaderMeta("brands");
  return buildMetadata({ locale, path: "/brands", seo: header?.seo, fallbackTitle: pageTitle(header, locale) ?? t("title") });
}

async function getBrands(locale: string) {
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { slug: "asc" }],
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

export default async function BrandsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = await getLocale();
  const t = await getTranslations("brands");
  const tCommon = await getTranslations("common");
  const brands = await getBrands(locale);

  const results = brands.length > 0 ? (
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
  );

  // Phase 7: the page's own generic header/intro is now a real, admin-editable Page Builder
  // section (see src/lib/page-builder/page-headers.ts) -- falls back to the exact original
  // hardcoded text if the one-time seed script hasn't been run in this environment yet.
  const draftPreview = await isDraftPreviewRequest(await searchParams);
  const headerSections = await loadPageHeaderSections("brands", draftPreview);
  if (!headerSections) {
    return (
      <Section tone="paper" eyebrow={t("eyebrow")} title={t("title")}>
        {results}
      </Section>
    );
  }

  return (
    <>
      <SectionRenderer sections={headerSections} locale={locale} />
      {draftPreview ? <DraftPreviewBanner /> : null}
      <Section tone="paper">{results}</Section>
    </>
  );
}
