import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/site/legal-page";
import { TERMS_CONTENT } from "@/lib/legal-content";
import { buildMetadata } from "@/lib/seo/metadata";
import { pageCopy } from "@/lib/seo/page-copy";
import { pageTitle } from "@/lib/page-builder/page-title";
import { renderCmsRoutePage, loadPublishedPageMeta } from "@/components/site/cms-route-page";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  // PHASE 8: a published Page Builder page with this slug supplies the title/SEO (and content, below).
  const cms = await loadPublishedPageMeta("terms");
  return buildMetadata({ locale, path: "/terms", copy: pageCopy("terms", locale), seo: cms?.seo, fallbackTitle: pageTitle(cms, locale) ?? t("termsTitle") });
}

export default async function TermsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // PHASE 8: editable through the Page Builder (page slug "terms"); the built-in text below is the fallback.
  const cms = await renderCmsRoutePage("terms", await searchParams);
  if (cms) return cms;
  return <LegalPage titleKey="termsTitle" content={TERMS_CONTENT} />;
}
