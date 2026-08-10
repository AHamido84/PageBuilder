import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { buttonClasses } from "@/components/ui/button";
import { SOLUTIONS_SEGMENTS } from "@/lib/solutions-segments";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/site/json-ld";

export const dynamic = "force-dynamic";

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

  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}` },
    { name: tSolutionsIndex("title"), url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/solutions` },
    { name: t(`${segment.key}.name`), url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/solutions/${segmentSlug}` },
  ]);

  return (
    <div>
      <JsonLd data={breadcrumb} />
      <Section tone="paper" className="border-t-0 pb-10 pt-14 sm:pt-20">
        <p className="manifest-strip mb-4 text-harbor">{t(`${segment.key}.name`)}</p>
        <h1 className="font-display max-w-2xl text-4xl leading-[1.08] sm:text-5xl">{t(`${segment.key}.summary`)}</h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink/70 sm:text-lg">{t(`${segment.key}.body`)}</p>
        <Link href={`/${locale}/contact`} className={`${buttonClasses("primary", "lg")} mt-8 inline-flex`}>
          {tHome("ctaButton")}
        </Link>
      </Section>

      <Section tone="ink">
        <Container>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n}>
                <p className="font-display text-lg">{tHome(`why${n}Title`)}</p>
                <p className="mt-2 text-sm leading-relaxed text-paper/60">{tHome(`why${n}Body`)}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>
    </div>
  );
}
