import { getTranslations } from "next-intl/server";
import { MapPin, Mail, Phone, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { StyledText } from "@/components/text/styled-text";
import { richOf } from "@/lib/text-style/rich-text";
import type { BlockRenderProps } from "../../types";
import type { ContactInfoData } from "../misc-blocks";

const DAY_ORDER = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

/** Phase 7: presentation-only redesign (Card frame, icon-labeled rows, a proper frame around the
 * map) -- every field/query/label below is unchanged from before; only the markup/classNames are
 * new. Async Server Component (live SiteSetting query) -- never mounts in the admin canvas, see
 * ContactInfoPreview in contact-info.tsx. */
export async function ContactInfoRender({ data, locale }: BlockRenderProps<ContactInfoData>) {
  const t = await getTranslations({ locale, namespace: "contactPage" });
  const settings = await prisma.siteSetting.findUnique({ where: { id: "singleton" } });
  const hours = settings?.businessHours as Record<string, string> | null;
  const hasHours = hours ? DAY_ORDER.some((day) => hours[day]) : false;

  return (
    <div className="max-w-md ms-[var(--pb-box-s,0)] me-[var(--pb-box-e,auto)]">
      <Card variant="default" className="p-6 sm:p-8">
        {data.heading ? <p className="manifest-strip mb-5 text-harbor"><StyledText text={data.heading} rich={richOf(data, "heading")} /></p> : null}
        <dl className="space-y-5 text-base">
          <div className="flex items-start gap-3">
            <MapPin size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-harbor" aria-hidden="true" />
            <div>
              <dt className="text-sm opacity-50">{t("locationLabel")}</dt>
              <dd className="mt-1 font-display text-xl">{t("location")}</dd>
            </div>
          </div>
          {settings?.contactEmail ? (
            <div className="flex items-start gap-3">
              <Mail size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-harbor" aria-hidden="true" />
              <div>
                <dt className="text-sm opacity-50">{t("emailLabel")}</dt>
                <dd className="mt-1 font-medium">
                  <a href={`mailto:${settings.contactEmail}`} dir="ltr" className="inline-block hover:text-harbor hover:underline">
                    {settings.contactEmail}
                  </a>
                </dd>
              </div>
            </div>
          ) : null}
          {settings?.contactPhone ? (
            <div className="flex items-start gap-3">
              <Phone size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-harbor" aria-hidden="true" />
              <div>
                <dt className="text-sm opacity-50">{t("phoneLabel")}</dt>
                <dd className="mt-1 font-medium">
                  <a href={`tel:${settings.contactPhone}`} dir="ltr" className="inline-block hover:text-harbor hover:underline">
                    {settings.contactPhone}
                  </a>
                </dd>
              </div>
            </div>
          ) : null}
        </dl>

        {hasHours ? (
          <div className="mt-8 border-t border-current/10 pt-6">
            <p className="mb-4 flex items-center gap-2 text-sm opacity-50">
              <Clock size={16} strokeWidth={1.75} aria-hidden="true" />
              {t("hoursLabel")}
            </p>
            <dl className="space-y-2 text-sm">
              {DAY_ORDER.filter((day) => hours![day]).map((day) => (
                <div key={day} className="flex items-center justify-between gap-4">
                  <dt className="opacity-60">{t(`days.${day}`)}</dt>
                  <dd className={hours![day].toLowerCase() === "closed" ? "opacity-40" : "font-mono-data font-medium"}>
                    {hours![day].toLowerCase() === "closed" ? t("closed") : hours![day]}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </Card>

      {settings?.mapEmbedUrl ? (
        <div className="mt-6 overflow-hidden rounded-[var(--card-radius-lg)] border border-line shadow-[var(--shadow-flat)]">
          <iframe src={settings.mapEmbedUrl} className="h-80 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={t("locationLabel")} />
        </div>
      ) : null}
    </div>
  );
}
