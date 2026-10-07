import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/empty-state";
import { FaqAccordion } from "./faq-accordion";
import { buildMetadata } from "@/lib/seo/metadata";
import { pageCopy } from "@/lib/seo/page-copy";
import { faqSchema } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/site/json-ld";
import { pageTitle } from "@/lib/page-builder/page-title";
import { loadPageHeaderSections, loadPageHeaderMeta } from "@/lib/page-builder/page-headers";
import { isDraftPreviewRequest } from "@/lib/page-builder/render-page";
import { SectionRenderer } from "@/components/site/section-renderer";
import { DraftPreviewBanner } from "@/components/site/draft-preview-banner";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq" });
  const header = await loadPageHeaderMeta("faq");
  return buildMetadata({ locale, path: "/faq", copy: pageCopy("faq", locale), seo: header?.seo, fallbackTitle: pageTitle(header, locale) ?? t("title") });
}

export default async function FaqPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
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

  const body =
    faqs.length > 0 ? (
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
      );

  // PHASE 8: the header/intro is an editable Page Builder page (__header__faq) when one is
  // published; otherwise the original built-in header, unchanged.
  const draftPreview = await isDraftPreviewRequest(await searchParams);
  const headerSections = await loadPageHeaderSections("faq", draftPreview);
  if (!headerSections) {
    return (
      <Section titleAs="h1" tone="paper" eyebrow={t("eyebrow")} title={t("title")}>
        {body}
      </Section>
    );
  }
  return (
    <>
      <SectionRenderer sections={headerSections} locale={locale} />
      {draftPreview ? <DraftPreviewBanner /> : null}
      <Section tone="paper">{body}</Section>
    </>
  );
}
