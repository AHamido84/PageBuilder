import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/ui/section";
import { ContactForm } from "../contact-form";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const t = await getTranslations("contactPage");
  const settings = await prisma.siteSetting.findUnique({ where: { id: "singleton" } });

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
                  <a href={`mailto:${settings.contactEmail}`} className="hover:text-harbor">
                    {settings.contactEmail}
                  </a>
                </dd>
              </div>
            ) : null}
            {settings?.contactPhone ? (
              <div>
                <dt className="text-ink/50">{t("phoneLabel")}</dt>
                <dd className="mt-0.5 font-medium">
                  <a href={`tel:${settings.contactPhone}`} className="hover:text-harbor">
                    {settings.contactPhone}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
        <ContactForm />
      </div>
    </Section>
  );
}
