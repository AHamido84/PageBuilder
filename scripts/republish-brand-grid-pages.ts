/**
 * Phase 6 brand-card redesign: BRAND_GRID's `resolvedBrands` snapshot is frozen once, at publish
 * time (see commerce-blocks.ts's `resolvedBrands` doc comment and actions.ts's
 * freezeBrandGridSection) -- so any already-published page with a BRAND_GRID section is still
 * showing whatever fields existed in that snapshot at its last publish. Adding `description`/
 * `website` to the schema doesn't retroactively appear on those pages until they're republished.
 *
 * This re-runs that exact freeze for every currently-published page that has a BRAND_GRID
 * section, without changing anything else about the page (no section added/removed/reordered --
 * unlike fix-solution-page-order.ts, this only refreshes the cached resolvedBrands snapshot).
 *
 * Run: npx tsx scripts/republish-brand-grid-pages.ts
 */
import { prisma } from "../src/lib/prisma";
import { brandGridSchema } from "../src/lib/page-builder/blocks/commerce-blocks";

async function freezeBrandGridSection(rawData: unknown, locale: "en" | "ar"): Promise<unknown> {
  const parsed = brandGridSchema.safeParse(rawData);
  if (!parsed.success) return rawData;
  const mode = parsed.data.mode ?? "dynamic";
  const brandIds = parsed.data.brandIds;
  const brands =
    mode === "manual"
      ? await prisma.brand.findMany({
          where: brandIds.length ? { id: { in: brandIds } } : { isActive: true },
          include: { translations: true, logo: { select: { url: true } }, _count: { select: { products: true } } },
        })
      : await prisma.brand.findMany({
          where: { isActive: true, isFeatured: true },
          orderBy: { order: "asc" },
          take: parsed.data.limit,
          include: { translations: true, logo: { select: { url: true } }, _count: { select: { products: true } } },
        });
  const resolvedBrands = brands.map((b) => {
    const translation = b.translations.find((t) => t.locale === locale.toUpperCase());
    return {
      id: b.id,
      name: translation?.name ?? b.slug,
      slug: b.slug,
      logoUrl: b.logo?.url ?? null,
      logoId: b.logoId,
      description: translation?.description ?? null,
      website: b.website ?? null,
      productCount: b._count.products,
    };
  });
  return { ...parsed.data, resolvedBrands };
}

async function main() {
  const sections = await prisma.pageSection.findMany({
    where: { type: "BRAND_GRID" },
    include: { page: true },
  });
  const pageIds = [...new Set(sections.filter((s) => s.page.status === "PUBLISHED").map((s) => s.pageId))];

  for (const pageId of pageIds) {
    const page = await prisma.page.findUniqueOrThrow({ where: { id: pageId }, include: { sections: { orderBy: { order: "asc" } } } });

    const snapshotSections = await Promise.all(
      page.sections.map(async (s) => ({
        id: s.id,
        type: s.type,
        order: s.order,
        dataEn: s.type === "BRAND_GRID" ? await freezeBrandGridSection(s.dataEn, "en") : s.dataEn,
        dataAr: s.type === "BRAND_GRID" ? await freezeBrandGridSection(s.dataAr, "ar") : s.dataAr,
        settings: s.settings,
        isVisible: s.isVisible,
      }))
    );

    await prisma.$transaction(async (tx) => {
      await tx.pageRevision.updateMany({ where: { pageId, isPublished: true }, data: { isPublished: false } });
      await tx.pageRevision.create({
        data: { pageId, isPublished: true, note: "Phase 6: refresh BRAND_GRID resolvedBrands (description/website)", snapshot: { sections: snapshotSections } as object },
      });
    });

    console.log(`Republished "${page.slug}" -- resolvedBrands refreshed with description/website.`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
