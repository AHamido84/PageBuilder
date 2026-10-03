import { getLocale, getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/section";
import { LEGAL_UPDATED, type LegalContent } from "@/lib/legal-content";


export async function LegalPage({ titleKey, content }: { titleKey: "privacyTitle" | "termsTitle" | "cookieTitle"; content: LegalContent }) {
  const locale = await getLocale();
  const t = await getTranslations("legal");
  const sections = locale === "ar" ? content.ar : content.en;
  const updated = LEGAL_UPDATED;

  return (
    <Section tone="paper" className="border-t-0 pb-20 pt-14 sm:pt-20">
      <h1 className="font-display max-w-2xl text-4xl leading-[1.08] sm:text-5xl">{t(titleKey)}</h1>
      <p className="font-mono-data mt-4 text-xs text-ink/40">
        {t("updated")}: {updated}
      </p>
      <div className="mt-10 max-w-3xl space-y-8">
        {sections.map((section) => (
          <div key={section.heading}>
            <h2 className="font-display text-xl">{section.heading}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/70 sm:text-base">{section.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
