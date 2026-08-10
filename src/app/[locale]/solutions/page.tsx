import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { SOLUTIONS_SEGMENTS } from "@/lib/solutions-segments";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "solutionsIndex" });
  return buildMetadata({ locale, path: "/solutions", fallbackTitle: t("title"), fallbackDescription: t("body") });
}

export default async function SolutionsIndexPage() {
  const locale = await getLocale();
  const t = await getTranslations("solutionsIndex");
  const tSolutions = await getTranslations("solutions");

  return (
    <Section tone="paper" eyebrow={t("eyebrow")} title={t("title")} description={t("body")}>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SOLUTIONS_SEGMENTS.map((segment) => (
          <Link key={segment.slug} href={`/${locale}/solutions/${segment.slug}`}>
            <Card className="h-full p-6">
              <p className="font-display text-xl">{tSolutions(`${segment.key}.name`)}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink/60">{tSolutions(`${segment.key}.summary`)}</p>
            </Card>
          </Link>
        ))}
      </div>
    </Section>
  );
}
