import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { InfoPage } from "@/components/site/info-page";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "quality" });
  return buildMetadata({ locale, path: "/quality-food-safety", fallbackTitle: t("title"), fallbackDescription: t("intro") });
}

export default function QualityFoodSafetyPage() {
  return <InfoPage namespace="quality" />;
}
