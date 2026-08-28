import { prisma } from "@/lib/prisma";
import { RouteLine } from "@/components/site/graphics/route-line";
import { CmsFillImage } from "@/components/media/cms-image";
import type { BlockRenderProps } from "../../types";
import type { CertificationsGridData } from "../commerce-blocks";

/** Same recurring card accent used by Category/Brand grids wherever a real photo isn't set yet. */
const CARD_ACCENT_PATH = "M4 32 Q 36 4 68 32";

interface CertificationCard {
  id: string;
  name: string;
  issuer: string | null;
  imageUrl: string | null;
  imageId: string | null;
}

async function loadCertifications(locale: string, limit: number | undefined): Promise<CertificationCard[]> {
  const rows = await prisma.certification.findMany({
    where: { isPublished: true },
    orderBy: [{ order: "asc" }, { nameEn: "asc" }],
    include: { image: { select: { url: true } } },
    take: limit,
  });
  return rows.map((c) => ({
    id: c.id,
    name: locale === "ar" ? c.nameAr : c.nameEn,
    issuer: c.issuer,
    imageUrl: c.image?.url ?? null,
    imageId: c.imageId,
  }));
}

export async function CertificationsGridRender({ data, locale }: BlockRenderProps<CertificationsGridData>) {
  const certifications = await loadCertifications(locale, data.limit);
  if (certifications.length === 0) return null;

  return (
    <div>
      {data.heading ? <h2 className="mb-8 font-display text-3xl">{data.heading}</h2> : null}
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        {certifications.map((cert) => {
          const hasImage = Boolean(cert.imageUrl);
          return (
            <div key={cert.id} className="group relative flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-[var(--radius-md)] border border-current/10 bg-paper p-4 text-center">
              <div aria-hidden className="bg-grid-fine pointer-events-none absolute inset-0" />
              {hasImage ? (
                <CmsFillImage
                  src={cert.imageUrl!}
                  alt={cert.name}
                  sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 33vw"
                  className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
                  context={{ mediaId: cert.imageId ?? undefined, component: "CERTIFICATIONS_GRID", locale }}
                />
              ) : (
                <RouteLine d={CARD_ACCENT_PATH} viewBox="0 0 72 36" strokeWidth={1.5} className="relative h-9 w-[4.5rem] text-harbor/50" />
              )}
              <div className="relative">
                <p className="font-display text-sm leading-tight">{cert.name}</p>
                {cert.issuer ? <p className="mt-0.5 text-xs opacity-60">{cert.issuer}</p> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
