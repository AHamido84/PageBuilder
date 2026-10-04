/**
 * Visual audit 2026-10-04 -- catalog/site-name spelling fixes that live in the database (shared by
 * both domains). Code changes cover everything else; homepage category cards take their titles
 * from the catalog category names, so fixing the names here fixes the homepage, the products
 * filter, the mega menu and the category pages at once.
 *
 *   - Category names (AR): "مجمده" -> "مجمدة"
 *   - Brand names (AR) and SiteSetting site name (AR): "جولدن سيفين" / "جولدن سيفن" / ... -> "جولدن سفن"
 *
 *   npx tsx scripts/fix-audit-content.ts            # dry run: prints every change, writes nothing
 *   npx tsx scripts/fix-audit-content.ts --apply    # writes the changes
 *
 * Uses whatever DATABASE_URL is in the environment -- run it against production only deliberately.
 * Idempotent: a second run finds nothing to change.
 */
import { PrismaClient } from "@prisma/client";
import { normalizeBrandSpelling } from "../src/lib/brand";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

const fixFrozen = (text: string) => text.replace(/مجمده(?=\s|$|[.،,])/g, "مجمدة");

async function main() {
  const changes: { what: string; from: string; to: string; run: () => Promise<unknown> }[] = [];

  const categoryTranslations = await prisma.categoryTranslation.findMany({ where: { locale: "AR" }, select: { id: true, name: true } });
  for (const t of categoryTranslations) {
    const next = fixFrozen(t.name);
    if (next !== t.name) changes.push({ what: "category name (AR)", from: t.name, to: next, run: () => prisma.categoryTranslation.update({ where: { id: t.id }, data: { name: next } }) });
  }

  const brandTranslations = await prisma.brandTranslation.findMany({ where: { locale: "AR" }, select: { id: true, name: true } });
  for (const t of brandTranslations) {
    const next = normalizeBrandSpelling(t.name);
    if (next !== t.name) changes.push({ what: "brand name (AR)", from: t.name, to: next, run: () => prisma.brandTranslation.update({ where: { id: t.id }, data: { name: next } }) });
  }

  const settings = await prisma.siteSetting.findUnique({ where: { id: "singleton" }, select: { siteNameAr: true } });
  if (settings?.siteNameAr) {
    const next = normalizeBrandSpelling(settings.siteNameAr);
    if (next !== settings.siteNameAr) changes.push({ what: "site name (AR)", from: settings.siteNameAr, to: next, run: () => prisma.siteSetting.update({ where: { id: "singleton" }, data: { siteNameAr: next } }) });
  }

  if (changes.length === 0) {
    console.log("Nothing to change.");
    return;
  }
  for (const c of changes) console.log(`${c.what}: "${c.from}" -> "${c.to}"`);
  if (!apply) {
    console.log(`\nDry run -- ${changes.length} change(s), nothing written. Re-run with --apply.`);
    return;
  }
  await prisma.$transaction(changes.map((c) => c.run()) as never);
  console.log(`\nApplied ${changes.length} change(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
