import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/section";
import { buttonClasses } from "@/components/ui/button";

export default async function NotFound() {
  const locale = await getLocale();
  const t = await getTranslations("productDetail");

  return (
    <Section tone="paper" className="border-t-0 text-center">
      <h1 className="font-display text-3xl">{t("notFoundTitle")}</h1>
      <p className="mx-auto mt-3 max-w-md text-ink/60">{t("notFoundBody")}</p>
      <Link href={`/${locale}`} className={`${buttonClasses("secondary", "md")} mt-8 inline-flex`}>
        {locale === "ar" ? "العودة إلى الرئيسية" : "Back to home"}
      </Link>
    </Section>
  );
}
