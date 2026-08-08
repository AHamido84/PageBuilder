import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { buttonClasses } from "@/components/ui/button";

export async function InfoPage({ namespace }: { namespace: "quality" | "distribution" }) {
  const locale = await getLocale();
  const t = await getTranslations(namespace);
  const tHome = await getTranslations("home");

  return (
    <div>
      <Section tone="paper" className="border-t-0 pb-10 pt-14 sm:pt-20">
        <p className="manifest-strip mb-4 text-harbor">{t("eyebrow")}</p>
        <h1 className="font-display max-w-2xl text-4xl leading-[1.08] sm:text-5xl">{t("title")}</h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink/70 sm:text-lg">{t("intro")}</p>
      </Section>

      <Section tone="frost">
        <ol className="grid gap-8 sm:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <li key={n} className="border-t border-ink/15 pt-5">
              <span className="font-mono-data text-xs text-ink/40">0{n}</span>
              <p className="font-display mt-2 text-xl">{t(`section${n}Title`)}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink/65">{t(`section${n}Body`)}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="ink" className="text-center">
        <Container className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl sm:text-4xl">{tHome("ctaTitle")}</h2>
          <p className="mx-auto mt-4 text-paper/65">{tHome("ctaBody")}</p>
          <Link href={`/${locale}/contact`} className={`${buttonClasses("primary", "lg")} mt-8 inline-flex`}>
            {tHome("ctaButton")}
          </Link>
        </Container>
      </Section>
    </div>
  );
}
