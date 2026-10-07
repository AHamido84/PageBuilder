import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/site/legal-page";
import { PRIVACY_CONTENT } from "@/lib/legal-content";
import { buildMetadata } from "@/lib/seo/metadata";
import { pageCopy } from "@/lib/seo/page-copy";
import { pageTitle } from "@/lib/page-builder/page-title";
import { renderCmsRoutePage, loadPublishedPageMeta } from "@/components/site/cms-route-page";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  // PHASE 8: a published Page Builder page with this slug supplies the title/SEO (and content, below).
  const cms = await loadPublishedPageMeta("privacy");
  return buildMetadata({ locale, path: "/privacy", copy: pageCopy("privacy", locale), seo: cms?.seo, fallbackTitle: pageTitle(cms, locale) ?? t("privacyTitle") });
}

export default async function PrivacyPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // PHASE 8: editable through the Page Builder (page slug "privacy"); the built-in text below is the fallback.
  const cms = await renderCmsRoutePage("privacy", await searchParams);
  if (cms) return cms;
  return <LegalPage titleKey="privacyTitle" content={PRIVACY_CONTENT} />;
}
