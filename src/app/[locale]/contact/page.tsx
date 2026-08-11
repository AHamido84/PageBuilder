import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/ui/section";
import { ContactForm } from "../contact-form";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contactPage" });
  return buildMetadata({ locale, path: "/contact", fallbackTitle: t("title"), fallbackDescription: t("subtitle") });
}

const DAY_ORDER = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

export default async function ContactPage() {
  const t = await getTranslations("contactPage");
  const settings = await prisma.siteSetting.findUnique({ where: { id: "singleton" } });
  const hours = settings?.businessHours as Record<string, string> | null;
  const hasHours = hours ? DAY_ORDER.some((day) => hours[day]) : false;

  return (
    <Section tone="paper" className="border-t-0" eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")}>
      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="manifest-strip mb-4 text-ink/40">{t("detailsTitle")}</p>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-ink/50">{t("locationLabel")}</dt>
              <dd className="mt-0.5 font-medium">{t("location")}</dd>
            </div>
            {settings?.contactEmail ? (
              <div>
                <dt className="text-ink/50">{t("emailLabel")}</dt>
                <dd className="mt-0.5 font-medium">
                  <a href={`mailto:${settings.contactEmail}`} dir="ltr" className="inline-block hover:text-harbor">
                    {settings.contactEmail}
                  </a>
                </dd>
              </div>
            ) : null}
            {settings?.contactPhone ? (
              <div>
                <dt className="text-ink/50">{t("phoneLabel")}</dt>
                <dd className="mt-0.5 font-medium">
                  <a href={`tel:${settings.contactPhone}`} dir="ltr" className="inline-block hover:text-harbor">
                    {settings.contactPhone}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
          {hasHours ? (
            <div className="mt-6 border-t border-ink/10 pt-6">
              <p className="manifest-strip mb-3 text-ink/40">{t("hoursLabel")}</p>
              <dl className="space-y-1.5 text-sm">
                {DAY_ORDER.filter((day) => hours![day]).map((day) => (
                  <div key={day} className="flex items-center justify-between gap-4">
                    <dt className="text-ink/60">{t(`days.${day}`)}</dt>
                    <dd className={hours![day].toLowerCase() === "closed" ? "text-ink/40" : "font-medium font-mono-data"}>
                      {hours![day].toLowerCase() === "closed" ? t("closed") : hours![day]}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
          {settings?.mapEmbedUrl ? (
            <iframe
              src={settings.mapEmbedUrl}
              className="mt-6 h-64 w-full rounded-[var(--radius-md)] border border-ink/10"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={t("locationLabel")}
            />
          ) : null}
        </div>
        <ContactForm showTypeSelector />
      </div>
    </Section>
  );
}
