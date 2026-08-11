"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Section } from "@/components/ui/section";
import { buttonClasses } from "@/components/ui/button";

export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("error");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Section tone="paper" className="border-t-0 text-center">
      <h1 className="font-display text-3xl">{t("title")}</h1>
      <p className="mx-auto mt-3 max-w-md text-ink/60">{t("body")}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={reset} className={buttonClasses("primary", "md")}>
          {tCommon("tryAgain")}
        </button>
        <Link href={`/${locale}`} className={buttonClasses("secondary", "md")}>
          {t("backHome")}
        </Link>
      </div>
    </Section>
  );
}
