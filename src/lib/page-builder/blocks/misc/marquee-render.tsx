import { prisma } from "@/lib/prisma";
import type { BlockRenderProps } from "../../types";
import type { MarqueeData } from "../misc-blocks";

/** Async Server Component (live brand/category query) — never mounts in the admin canvas, see MarqueePreview in marquee.tsx. */
export async function MarqueeRender({ data, locale }: BlockRenderProps<MarqueeData>) {
  const localeCode = locale.toUpperCase();
  const names =
    data.source === "categories"
      ? (await prisma.category.findMany({ where: { isActive: true }, include: { translations: true }, orderBy: { order: "asc" } })).map(
          (c) => c.translations.find((t) => t.locale === localeCode)?.name ?? c.slug
        )
      : (await prisma.brand.findMany({ where: { isActive: true }, include: { translations: true } })).map(
          (b) => b.translations.find((t) => t.locale === localeCode)?.name ?? b.slug
        );

  if (names.length === 0) return null;

  // Duplicated once so the CSS keyframe (translateX 0 -> -50%) loops seamlessly.
  const loop = [...names, ...names];

  return (
    <div>
      {data.heading ? <h2 className="mb-8 font-display text-3xl">{data.heading}</h2> : null}
      <div className="overflow-hidden border-y border-current/10 py-6">
        <div className="animate-marquee flex w-max items-center gap-12">
          {loop.map((name, i) => (
            <span key={i} className="font-display shrink-0 text-2xl opacity-60 sm:text-3xl">
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
