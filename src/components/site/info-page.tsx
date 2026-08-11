import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { FileText, Thermometer, Truck } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { buttonClasses } from "@/components/ui/button";
import { IconFeatureGrid } from "./icon-feature-grid";

// Inherits the section's own text color rather than a fixed wheat, which measured under WCAG AA
// against paper/frost (see about/page.tsx for the contrast numbers that prompted this).
const ICON_PROPS = { size: 22, strokeWidth: 1.75, className: "opacity-70", "aria-hidden": true } as const;
const SECTION_ICONS = [Thermometer, Truck, FileText];

export async function InfoPage({ namespace }: { namespace: "quality" }) {
  const locale = await getLocale();
  const t = await getTranslations(namespace);
  const tHome = await getTranslations("home");

  const sections = [1, 2, 3].map((n) => {
    const SectionIcon = SECTION_ICONS[n - 1];
    return {
      icon: <SectionIcon {...ICON_PROPS} />,
      title: t(`section${n}Title`),
      body: t(`section${n}Body`),
    };
  });

  return (
    <div>
      <Section tone="paper" className="border-t-0 pb-10 pt-14 sm:pt-20">
        <p className="manifest-strip mb-4 text-harbor">{t("eyebrow")}</p>
        <h1 className="font-display text-hero measure-ar max-w-2xl">{t("title")}</h1>
        <p className="measure-ar mt-6 max-w-2xl text-base leading-relaxed text-ink/70 sm:text-lg">{t("intro")}</p>
      </Section>

      <Section tone="frost">
        <IconFeatureGrid items={sections} columns={3} />
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
