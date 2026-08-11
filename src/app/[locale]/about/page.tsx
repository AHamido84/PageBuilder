import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { CheckCircle2, Crosshair, Eye, Handshake, MapPin, Package, ShieldCheck, Snowflake, Target, UtensilsCrossed } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { buttonClasses } from "@/components/ui/button";
import { IconFeatureGrid } from "@/components/site/icon-feature-grid";
import { ProcessTimeline } from "@/components/site/process-timeline";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

// Inherits the section's own text color (ink on light tones, paper on ink) so contrast is always
// correct — a fixed wheat icon color measured well under WCAG AA against paper (2.37:1) and frost (2.03:1).
const ICON_PROPS = { size: 22, strokeWidth: 1.75, className: "opacity-70", "aria-hidden": true } as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return buildMetadata({ locale, path: "/about", fallbackTitle: t("title"), fallbackDescription: t("storyBody") });
}

export default async function AboutPage() {
  const locale = await getLocale();
  const t = await getTranslations("about");
  const tHome = await getTranslations("home");

  const values = [
    { icon: <CheckCircle2 {...ICON_PROPS} />, title: t("value1Title"), body: t("value1Body") },
    { icon: <ShieldCheck {...ICON_PROPS} />, title: t("value2Title"), body: t("value2Body") },
    { icon: <Crosshair {...ICON_PROPS} />, title: t("value3Title"), body: t("value3Body") },
    { icon: <Handshake {...ICON_PROPS} />, title: t("value4Title"), body: t("value4Body") },
  ];

  const whyItems = [
    { icon: <Snowflake {...ICON_PROPS} />, title: tHome("why1Title"), body: tHome("why1Body") },
    { icon: <Package {...ICON_PROPS} />, title: tHome("why2Title"), body: tHome("why2Body") },
    { icon: <UtensilsCrossed {...ICON_PROPS} />, title: tHome("why3Title"), body: tHome("why3Body") },
    { icon: <MapPin {...ICON_PROPS} />, title: tHome("why4Title"), body: tHome("why4Body") },
  ];

  const processSteps = [1, 2, 3].map((n) => ({
    number: `0${n}`,
    title: t(`process${n}Title`),
    body: t(`process${n}Body`),
  }));

  return (
    <div>
      <Section tone="paper" className="border-t-0 pb-10 pt-14 text-center sm:pt-20">
        <p className="manifest-strip mb-4 text-harbor">{t("eyebrow")}</p>
        <h1 className="font-display text-hero measure-ar mx-auto max-w-3xl">{t("title")}</h1>
      </Section>

      <Section tone="paper" eyebrow={t("storyEyebrow")} title={t("storyTitle")}>
        <p className="measure-ar max-w-2xl text-base leading-relaxed text-ink/70 sm:text-lg">{t("storyBody")}</p>
      </Section>

      <Section tone="ink">
        <div className="grid gap-10 sm:grid-cols-2">
          <div>
            <Target size={22} strokeWidth={1.75} className="text-wheat" aria-hidden="true" />
            <p className="manifest-strip mb-1 mt-4 text-wheat">{t("missionTitle")}</p>
            <p className="mt-2 text-lg leading-relaxed">{t("missionBody")}</p>
          </div>
          <div>
            <Eye size={22} strokeWidth={1.75} className="text-wheat" aria-hidden="true" />
            <p className="manifest-strip mb-1 mt-4 text-wheat">{t("visionTitle")}</p>
            <p className="mt-2 text-lg leading-relaxed">{t("visionBody")}</p>
          </div>
        </div>
      </Section>

      <Section tone="paper" eyebrow={t("valuesEyebrow")} title={t("valuesTitle")}>
        <IconFeatureGrid items={values} />
      </Section>

      <Section tone="frost" eyebrow={t("processEyebrow")} title={t("processTitle")}>
        <ProcessTimeline steps={processSteps} />
      </Section>

      <Section tone="paper" eyebrow={t("whyEyebrow")} title={t("whyTitle")}>
        <IconFeatureGrid items={whyItems} />
      </Section>

      <Section tone="ink" className="text-center">
        <Container className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-h2">{t("ctaTitle")}</h2>
          <p className="mx-auto mt-4 text-paper/65">{t("ctaBody")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href={`/${locale}/contact`} className={buttonClasses("primary", "lg")}>
              {tHome("ctaButton")}
            </Link>
            <Link href={`/${locale}/products`} className={buttonClasses("ghost-light", "lg")}>
              {tHome("heroCtaSecondary")}
            </Link>
          </div>
        </Container>
      </Section>
    </div>
  );
}
