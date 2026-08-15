import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { buttonClasses } from "@/components/ui/button";
import { ColdChainJourney } from "@/components/site/cold-chain-journey";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "distribution" });
  return buildMetadata({ locale, path: "/distribution-logistics", fallbackTitle: t("title"), fallbackDescription: t("intro") });
}

export default async function DistributionLogisticsPage() {
  const locale = await getLocale();
  const t = await getTranslations("distribution");
  const tHome = await getTranslations("home");

  const steps = [1, 2, 3, 4, 5, 6].map((n) => ({
    title: t(`step${n}Title`),
    body: t(`step${n}Body`),
  }));

  return (
    <div>
      <Section tone="paper" className="border-t-0 pb-10 pt-14 sm:pt-20">
        <p className="manifest-strip mb-4 text-harbor">{t("eyebrow")}</p>
        <h1 className="font-display text-hero measure-ar max-w-2xl">{t("title")}</h1>
        <p className="measure-ar mt-6 max-w-2xl text-base leading-relaxed text-ink/70 sm:text-lg">{t("intro")}</p>
      </Section>

      <Section tone="frost" eyebrow={t("flowEyebrow")} title={t("flowTitle")}>
        <ColdChainJourney steps={steps} />
      </Section>

      <Section tone="ink" className="text-center">
        <Container className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-h2">{tHome("ctaTitle")}</h2>
          <p className="mx-auto mt-4 text-paper/65">{tHome("ctaBody")}</p>
          <Link href={`/${locale}/contact`} className={`${buttonClasses("primary", "lg")} mt-8 inline-flex`}>
            {tHome("ctaButton")}
          </Link>
        </Container>
      </Section>
    </div>
  );
}
