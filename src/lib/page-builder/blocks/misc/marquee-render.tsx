import { prisma } from "@/lib/prisma";
import { CmsImage } from "@/components/media/cms-image";
import { Marquee } from "@/components/ui/marquee";
import { StyledText } from "@/components/text/styled-text";
import { richOf } from "@/lib/text-style/rich-text";
import type { BlockRenderProps } from "../../types";
import type { MarqueeData } from "../misc-blocks";

interface MarqueeItem {
  name: string;
  logoUrl: string | null;
}

/** Async Server Component (live brand/category query) — never mounts in the admin canvas, see MarqueePreview in marquee.tsx. */
export async function MarqueeRender({ data, locale }: BlockRenderProps<MarqueeData>) {
  const localeCode = locale.toUpperCase();
  const items: MarqueeItem[] =
    data.source === "categories"
      ? (
          await prisma.category.findMany({
            where: { isActive: true },
            include: { translations: true, image: { select: { url: true } } },
            orderBy: { order: "asc" },
          })
        ).map((c) => ({ name: c.translations.find((t) => t.locale === localeCode)?.name ?? c.slug, logoUrl: c.image?.url ?? null }))
      : (
          await prisma.brand.findMany({ where: { isActive: true }, include: { translations: true, logo: { select: { url: true } } } })
        ).map((b) => ({ name: b.translations.find((t) => t.locale === localeCode)?.name ?? b.slug, logoUrl: b.logo?.url ?? null }));

  if (items.length === 0) return null;

  // "logos" mode falls back to that item's name whenever it has no uploaded image (a brand/category
  // that hasn't had a logo/image set yet) -- graceful degradation, never a broken/empty slot.
  const showLogos = data.contentType === "logos";

  // Duplicated once so the CSS keyframe (translateX 0 -> -50%) loops seamlessly.
  const loop = [...items, ...items];

  return (
    <div>
      {data.heading ? <h2 className="mb-8 font-display text-h2"><StyledText text={data.heading} rich={richOf(data, "heading")} /></h2> : null}
      <Marquee className="border-y border-current/10 py-8 sm:py-10" trackClassName="gap-16 sm:gap-20">
        {loop.map((item, i) =>
          showLogos && item.logoUrl ? (
            <CmsImage
              key={i}
              src={item.logoUrl}
              alt={item.name}
              className="h-14 w-auto shrink-0 object-contain opacity-70 transition-opacity duration-300 hover:opacity-100 sm:h-20"
              fallbackClassName="h-14 w-32 sm:h-20"
              context={{ component: "MARQUEE", locale }}
            />
          ) : (
            <span key={i} className="font-display shrink-0 text-3xl opacity-60 sm:text-5xl">
              {item.name}
            </span>
          )
        )}
      </Marquee>
    </div>
  );
}
