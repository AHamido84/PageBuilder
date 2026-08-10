import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { buttonClasses } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return buildMetadata({ locale, path: "/about", fallbackTitle: t("title"), fallbackDescription: t("storyBody") });
}

export default async function AboutPage() {
  const locale = await getLocale();
  const t = await getTranslations("about");
  const tHome = await getTranslations("home");

  return (
    <div>
      <Section tone="paper" className="border-t-0 pb-10 pt-14 text-center sm:pt-20">
        <p className="manifest-strip mb-4 text-harbor">{t("eyebrow")}</p>
        <h1 className="font-display mx-auto max-w-3xl text-4xl leading-[1.08] sm:text-5xl">{t("title")}</h1>
      </Section>

      <Section tone="paper" eyebrow={t("storyEyebrow")} title={t("storyTitle")}>
        <p className="max-w-2xl text-base leading-relaxed text-ink/70 sm:text-lg">{t("storyBody")}</p>
      </Section>

      <Section tone="ink">
        <div className="grid gap-10 sm:grid-cols-2">
          <div>
            <p className="manifest-strip mb-3 text-wheat">{t("missionTitle")}</p>
            <p className="text-lg leading-relaxed">{t("missionBody")}</p>
          </div>
          <div>
            <p className="manifest-strip mb-3 text-wheat">{t("visionTitle")}</p>
            <p className="text-lg leading-relaxed">{t("visionBody")}</p>
          </div>
        </div>
      </Section>

      <Section tone="paper" eyebrow={t("valuesEyebrow")} title={t("valuesTitle")}>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n}>
              <p className="font-display text-xl">{t(`value${n}Title`)}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink/65">{t(`value${n}Body`)}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="frost" eyebrow={t("processEyebrow")} title={t("processTitle")}>
        <ol className="grid gap-8 sm:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <li key={n} className="border-t border-ink/15 pt-5">
              <span className="font-mono-data text-xs text-ink/40">0{n}</span>
              <p className="font-display mt-2 text-xl">{t(`process${n}Title`)}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink/65">{t(`process${n}Body`)}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="paper" eyebrow={t("whyEyebrow")} title={t("whyTitle")}>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n}>
              <p className="font-display text-xl">{tHome(`why${n}Title`)}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink/65">{tHome(`why${n}Body`)}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="ink" className="text-center">
        <Container className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl sm:text-4xl">{t("ctaTitle")}</h2>
          <p className="mx-auto mt-4 text-paper/65">{t("ctaBody")}</p>
          <Link href={`/${locale}/contact`} className={`${buttonClasses("primary", "lg")} mt-8 inline-flex`}>
            {tHome("ctaButton")}
          </Link>
        </Container>
      </Section>
    </div>
  );
}
