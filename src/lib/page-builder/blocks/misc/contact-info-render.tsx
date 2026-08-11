import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import type { BlockRenderProps } from "../../types";
import type { ContactInfoData } from "../misc-blocks";

const DAY_ORDER = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

/** Async Server Component (live SiteSetting query) -- never mounts in the admin canvas, see ContactInfoPreview in contact-info.tsx. */
export async function ContactInfoRender({ data, locale }: BlockRenderProps<ContactInfoData>) {
  const t = await getTranslations({ locale, namespace: "contactPage" });
  const settings = await prisma.siteSetting.findUnique({ where: { id: "singleton" } });
  const hours = settings?.businessHours as Record<string, string> | null;
  const hasHours = hours ? DAY_ORDER.some((day) => hours[day]) : false;

  return (
    <div className="mx-auto max-w-md">
      {data.heading ? <p className="manifest-strip mb-4 opacity-40">{data.heading}</p> : null}
      <dl className="space-y-4 text-sm">
        <div>
          <dt className="opacity-50">{t("locationLabel")}</dt>
          <dd className="mt-0.5 font-medium">{t("location")}</dd>
        </div>
        {settings?.contactEmail ? (
          <div>
            <dt className="opacity-50">{t("emailLabel")}</dt>
            <dd className="mt-0.5 font-medium">
              <a href={`mailto:${settings.contactEmail}`} dir="ltr" className="inline-block hover:underline">
                {settings.contactEmail}
              </a>
            </dd>
          </div>
        ) : null}
        {settings?.contactPhone ? (
          <div>
            <dt className="opacity-50">{t("phoneLabel")}</dt>
            <dd className="mt-0.5 font-medium">
              <a href={`tel:${settings.contactPhone}`} dir="ltr" className="inline-block hover:underline">
                {settings.contactPhone}
              </a>
            </dd>
          </div>
        ) : null}
      </dl>

      {hasHours ? (
        <div className="mt-6 border-t border-current/10 pt-6">
          <p className="manifest-strip mb-3 opacity-40">{t("hoursLabel")}</p>
          <dl className="space-y-1.5 text-sm">
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

      {settings?.mapEmbedUrl ? (
        <iframe
          src={settings.mapEmbedUrl}
          className="mt-6 h-64 w-full rounded-[var(--radius-md)] border border-current/10"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={t("locationLabel")}
        />
      ) : null}
    </div>
  );
}
