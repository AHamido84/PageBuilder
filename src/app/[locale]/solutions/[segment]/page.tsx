import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { MapPin, Package, Snowflake, UtensilsCrossed } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { buttonClasses } from "@/components/ui/button";
import { IconFeatureGrid } from "@/components/site/icon-feature-grid";
import { RouteLine } from "@/components/site/graphics/route-line";
import { KineticText } from "@/lib/motion/primitives";
import { SOLUTIONS_SEGMENTS } from "@/lib/solutions-segments";
import { buildMetadata, SITE_URL } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/site/json-ld";

export const dynamic = "force-dynamic";

// Inherits the section's own text color rather than a fixed wheat, which measured under WCAG AA
// against paper/frost (see about/page.tsx for the contrast numbers that prompted this).
const ICON_PROPS = { size: 22, strokeWidth: 1.75, className: "opacity-70", "aria-hidden": true } as const;

export function generateStaticParams() {
  return SOLUTIONS_SEGMENTS.map((segment) => ({ segment: segment.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; segment: string }> }): Promise<Metadata> {
  const { locale, segment: segmentSlug } = await params;
  const segment = SOLUTIONS_SEGMENTS.find((s) => s.slug === segmentSlug);
  if (!segment) return {};
  const t = await getTranslations({ locale, namespace: "solutions" });
  return buildMetadata({
    locale,
    path: `/solutions/${segmentSlug}`,
    fallbackTitle: t(`${segment.key}.name`),
    fallbackDescription: t(`${segment.key}.summary`),
  });
}

export default async function SolutionsSegmentPage({ params }: { params: Promise<{ segment: string }> }) {
  const { segment: segmentSlug } = await params;
  const segment = SOLUTIONS_SEGMENTS.find((s) => s.slug === segmentSlug);
  if (!segment) notFound();

  const locale = await getLocale();
  const t = await getTranslations("solutions");
  const tHome = await getTranslations("home");
  const tSolutionsIndex = await getTranslations("solutionsIndex");
  const Icon = segment.icon;

  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/${locale}` },
    { name: tSolutionsIndex("title"), url: `${SITE_URL}/${locale}/solutions` },
    { name: t(`${segment.key}.name`), url: `${SITE_URL}/${locale}/solutions/${segmentSlug}` },
  ]);

  const whyItems = [
    { icon: <Snowflake {...ICON_PROPS} />, title: tHome("why1Title"), body: tHome("why1Body") },
    { icon: <Package {...ICON_PROPS} />, title: tHome("why2Title"), body: tHome("why2Body") },
    { icon: <UtensilsCrossed {...ICON_PROPS} />, title: tHome("why3Title"), body: tHome("why3Body") },
    { icon: <MapPin {...ICON_PROPS} />, title: tHome("why4Title"), body: tHome("why4Body") },
  ];

  return (
    <div>
      <JsonLd data={breadcrumb} />
      <Section tone="paper" className="border-t-0 pb-10 pt-14 sm:pt-20">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-wheat-soft">
            <Icon size={26} strokeWidth={1.75} className="text-harbor" aria-hidden="true" />
          </span>
          <RouteLine d={segment.accentPath} viewBox="0 0 80 36" strokeWidth={1.5} className="h-6 w-20 text-harbor/40" />
        </div>
        <p className="manifest-strip mb-3 mt-5 text-harbor">{t(`${segment.key}.name`)}</p>
        <KineticText as="h1" text={t(`${segment.key}.summary`)} className="font-display text-hero measure-ar max-w-2xl" />
        <p className="measure-ar mt-6 max-w-2xl text-base leading-relaxed text-ink/70 sm:text-lg">{t(`${segment.key}.body`)}</p>
        <Link href={`/${locale}/contact`} className={`${buttonClasses("primary", "lg")} mt-8 inline-flex`}>
          {tHome("ctaButton")}
        </Link>
      </Section>

      <Section tone="ink">
        <Container>
          <IconFeatureGrid items={whyItems} />
        </Container>
      </Section>
    </div>
  );
}
