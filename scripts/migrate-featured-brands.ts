/**
 * One-time content migration for the dynamic Brand Grid system (Brand.isFeatured/order, added by
 * migration 20260828003510_solutions_brand_certification) -- companion to
 * migrate-featured-categories.ts, same reasoning and same idempotent/rerunnable shape.
 *
 * Every existing BRAND_GRID Page Builder section already renders in "dynamic" mode as soon as this
 * feature's code ships (brandGridSchema.mode defaults to "dynamic" via Zod, and old section JSON
 * has no `mode` key). This script closes the resulting content gap by reproducing each section's
 * CURRENT effective output as real Brand.isFeatured/order data, so nothing on the live site changes
 * on deploy: for each existing BRAND_GRID section, resolves its brand list under the OLD semantics
 * (brandIds if set, else every active brand) and marks the union of all resolved brands Featured,
 * in first-seen order.
 *
 * Run: npx tsx scripts/migrate-featured-brands.ts
 */
import { prisma } from "../src/lib/prisma";

interface BrandGridLikeData {
  brandIds?: unknown;
}

function isBrandGridData(v: unknown): v is BrandGridLikeData {
  return typeof v === "object" && v !== null;
}

async function resolveOldBrandGridIds(data: unknown): Promise<string[]> {
  if (!isBrandGridData(data)) return [];
  const ids = Array.isArray(data.brandIds) ? data.brandIds.filter((x): x is string => typeof x === "string") : [];
  if (ids.length > 0) return ids;

  // Old "show all" fallback (empty brandIds): mirrors BrandGridRender's pre-migration loadLiveBrands query.
  const all = await prisma.brand.findMany({ where: { isActive: true }, select: { id: true }, orderBy: { slug: "asc" } });
  return all.map((b) => b.id);
}

async function main() {
  const pages = await prisma.page.findMany({
    include: {
      sections: { where: { type: "BRAND_GRID" } },
      revisions: { where: { isPublished: true }, take: 1 },
    },
  });

  const resolvedOrder: string[] = [];
  const seen = new Set<string>();

  for (const page of pages) {
    let sectionDataBlobs: unknown[] = [];

    if (page.status === "PUBLISHED" && page.revisions[0]) {
      const snapshot = page.revisions[0].snapshot as unknown as { sections?: { type: string; dataEn: unknown }[] };
      sectionDataBlobs = (snapshot.sections ?? []).filter((s) => s.type === "BRAND_GRID").map((s) => s.dataEn);
    } else {
      sectionDataBlobs = page.sections.map((s) => s.dataEn);
    }

    for (const blob of sectionDataBlobs) {
      const ids = await resolveOldBrandGridIds(blob);
      for (const id of ids) {
        if (!seen.has(id)) {
          seen.add(id);
          resolvedOrder.push(id);
        }
      }
    }
  }

  if (resolvedOrder.length === 0) {
    console.log("No existing BRAND_GRID content found to migrate -- nothing to do.");
    await prisma.$disconnect();
    return;
  }

  await prisma.$transaction(
    resolvedOrder.map((id, index) => prisma.brand.update({ where: { id }, data: { isFeatured: true, order: index } }))
  );

  console.log(`Marked ${resolvedOrder.length} brand${resolvedOrder.length === 1 ? "" : "s"} as Featured, preserving current display order:`);
  const named = await prisma.brand.findMany({ where: { id: { in: resolvedOrder } }, select: { slug: true, order: true }, orderBy: { order: "asc" } });
  for (const b of named) console.log(`  ${b.order + 1}. ${b.slug}`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
