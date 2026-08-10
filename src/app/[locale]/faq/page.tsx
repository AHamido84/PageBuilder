import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/empty-state";
import { FaqAccordion } from "./faq-accordion";
import { buildMetadata } from "@/lib/seo/metadata";
import { faqSchema } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/site/json-ld";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq" });
  return buildMetadata({ locale, path: "/faq", fallbackTitle: t("title") });
}

export default async function FaqPage() {
  const locale = await getLocale();
  const t = await getTranslations("faq");

  const faqs = await prisma.faq.findMany({ where: { isPublished: true }, orderBy: { order: "asc" } });

  const groups = new Map<string, typeof faqs>();
  for (const faq of faqs) {
    const key = faq.category ?? "";
    const list = groups.get(key) ?? [];
    list.push(faq);
    groups.set(key, list);
  }

  const faqJsonLd = faqSchema(
    faqs.map((faq) => ({
      question: locale === "ar" ? faq.questionAr : faq.questionEn,
      answer: locale === "ar" ? faq.answerAr : faq.answerEn,
    }))
  );

  return (
    <Section tone="paper" eyebrow={t("eyebrow")} title={t("title")}>
      {faqs.length > 0 ? (
        <>
          <JsonLd data={faqJsonLd} />
          <div className="mx-auto max-w-3xl space-y-10">
            {Array.from(groups.entries()).map(([category, items]) => (
              <div key={category}>
                {category ? <h2 className="mb-4 font-display text-xl">{category}</h2> : null}
                <FaqAccordion items={items} locale={locale} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState title={t("empty")} />
      )}
    </Section>
  );
}
