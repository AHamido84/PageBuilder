import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/empty-state";
import { FaqAccordion } from "./faq-accordion";

export const dynamic = "force-dynamic";

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: locale === "ar" ? faq.questionAr : faq.questionEn,
      acceptedAnswer: { "@type": "Answer", text: locale === "ar" ? faq.answerAr : faq.answerEn },
    })),
  };

  return (
    <Section tone="paper" eyebrow={t("eyebrow")} title={t("title")}>
      {faqs.length > 0 ? (
        <>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
