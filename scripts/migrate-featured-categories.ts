/**
 * One-time content migration for the dynamic Featured Categories system (Category.isFeatured /
 * Category.featuredOrder, added by migration 20260827202341_category_featured).
 *
 * Every existing CATEGORY_GRID Page Builder section already renders in "dynamic" mode as soon as
 * this feature's code ships -- categoryGridSchema.mode defaults to "dynamic" via Zod, and old
 * section JSON has no `mode` key, so SectionRenderer's schema parse fills it in automatically. That
 * means the live site would otherwise go from showing whatever categories were previously pinned
 * (or "all active", if none were) to showing nothing at all, until an admin manually re-marks
 * categories as Featured. This script closes that gap by reproducing today's effective output as
 * real Category.isFeatured/featuredOrder data, so nothing on the live site changes on deploy.
 *
 * For each Page, reads the *live* CATEGORY_GRID data -- the published revision's frozen snapshot for
 * a PUBLISHED page (what SectionRenderer actually reads, see src/app/[locale]/page.tsx), otherwise
 * the current draft PageSection rows -- and resolves it under the OLD semantics (categoryIds if set,
 * else every active category ordered by `order`). The union of every section's resolved list, in
 * first-seen order, becomes the new Featured set with sequential featuredOrder.
 *
 * Idempotent / safe to rerun: only ever sets isFeatured/featuredOrder on the resolved set, never
 * touches PageSection/PageRevision rows.
 *
 * Run: npx tsx scripts/migrate-featured-categories.ts
 */
import { prisma } from "../src/lib/prisma";

interface CategoryGridLikeData {
  categoryIds?: unknown;
}

function isCategoryGridData(v: unknown): v is CategoryGridLikeData {
  return typeof v === "object" && v !== null;
}

async function resolveOldCategoryGridIds(data: unknown): Promise<string[]> {
  if (!isCategoryGridData(data)) return [];
  const ids = Array.isArray(data.categoryIds) ? data.categoryIds.filter((x): x is string => typeof x === "string") : [];
  if (ids.length > 0) return ids;

  // Old "show all" fallback (empty categoryIds): mirror CategoryGridRender's pre-migration query.
  const all = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true },
    orderBy: [{ order: "asc" }, { slug: "asc" }],
  });
  return all.map((c) => c.id);
}

async function main() {
  const pages = await prisma.page.findMany({
    include: {
      sections: { where: { type: "CATEGORY_GRID" } },
      revisions: { where: { isPublished: true }, take: 1 },
    },
  });

  const resolvedOrder: string[] = [];
  const seen = new Set<string>();

  for (const page of pages) {
    let sectionDataBlobs: unknown[] = [];

    if (page.status === "PUBLISHED" && page.revisions[0]) {
      const snapshot = page.revisions[0].snapshot as unknown as { sections?: { type: string; dataEn: unknown }[] };
      sectionDataBlobs = (snapshot.sections ?? []).filter((s) => s.type === "CATEGORY_GRID").map((s) => s.dataEn);
    } else {
      sectionDataBlobs = page.sections.map((s) => s.dataEn);
    }

    for (const blob of sectionDataBlobs) {
      const ids = await resolveOldCategoryGridIds(blob);
      for (const id of ids) {
        if (!seen.has(id)) {
          seen.add(id);
          resolvedOrder.push(id);
        }
      }
    }
  }

  if (resolvedOrder.length === 0) {
    console.log("No existing CATEGORY_GRID content found to migrate -- nothing to do.");
    await prisma.$disconnect();
    return;
  }

  await prisma.$transaction(
    resolvedOrder.map((id, index) =>
      prisma.category.update({ where: { id }, data: { isFeatured: true, featuredOrder: index + 1 } })
    )
  );

  console.log(`Marked ${resolvedOrder.length} categor${resolvedOrder.length === 1 ? "y" : "ies"} as Featured, preserving current display order:`);
  const named = await prisma.category.findMany({
    where: { id: { in: resolvedOrder } },
    select: { slug: true, featuredOrder: true },
    orderBy: { featuredOrder: "asc" },
  });
  for (const c of named) console.log(`  ${c.featuredOrder}. ${c.slug}`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
