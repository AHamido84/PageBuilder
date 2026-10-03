/**
 * Golden Seven home v7: rewrites the homepage DRAFT as the nine G7_* sections in design order
 * (design-assets/reference), each with the design copy for both languages. Nothing goes live: only
 * the draft rows (PageSection) change; the published homepage keeps showing until someone clicks
 * Publish in the Page Builder, and every previous version stays restorable from Revision history.
 * The current draft sections are kept, appended hidden after the new ones, so nothing is lost.
 *
 *   npx tsx scripts/build-home-v7.ts            # writes the draft
 *   npx tsx scripts/build-home-v7.ts --dry-run  # prints the plan, writes nothing
 *
 * Uses whatever DATABASE_URL is in the environment -- run it against production only deliberately.
 */
import { randomUUID } from "node:crypto";
import { PrismaClient, type Prisma } from "@prisma/client";
import { getBlock } from "../src/lib/page-builder/registry";
import { HOMEPAGE_SLUG } from "../src/lib/page-builder/homepage";
import { GOLDEN_HOME_ORDER } from "../src/lib/page-builder/blocks/golden-blocks";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const page = await prisma.page.findUnique({ where: { slug: HOMEPAGE_SLUG }, include: { sections: { orderBy: { order: "asc" } } } });
  if (!page) throw new Error(`No homepage page (${HOMEPAGE_SLUG}) found.`);

  const fresh = GOLDEN_HOME_ORDER.map((type) => {
    const block = getBlock(type);
    if (!block) throw new Error(`Unknown block ${type}`);
    return {
      type,
      dataEn: block.dataSchema.parse(structuredClone(block.defaultData.en)),
      dataAr: block.dataSchema.parse(structuredClone(block.defaultData.ar)),
      settings: { en: structuredClone(block.defaultSettings), ar: structuredClone(block.defaultSettings) },
      isVisible: true,
    };
  });
  // Re-running the script replaces earlier G7 sections instead of stacking copies of them.
  const kept = page.sections
    .filter((s) => !s.type.startsWith("G7_"))
    .map((s) => ({ type: s.type, dataEn: s.dataEn, dataAr: s.dataAr, settings: s.settings, isVisible: false }));

  const rows = [...fresh, ...kept].map((section, order) => ({
    id: randomUUID(),
    pageId: page.id,
    type: section.type,
    order,
    dataEn: section.dataEn as Prisma.InputJsonValue,
    dataAr: section.dataAr as Prisma.InputJsonValue,
    settings: section.settings as Prisma.InputJsonValue,
    isVisible: section.isVisible,
  }));

  for (const r of rows) console.log(`${String(r.order + 1).padStart(2)}. ${r.type.padEnd(16)} ${r.isVisible ? "" : "(hidden, previous homepage)"}`);
  if (dryRun) {
    console.log("\nDry run -- nothing written.");
    return;
  }
  await prisma.$transaction([prisma.pageSection.deleteMany({ where: { pageId: page.id } }), prisma.pageSection.createMany({ data: rows })]);
  console.log(`\nDraft written (${rows.length} sections). Publish from the Page Builder to make it live.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
