/**
 * SEO fixes 2026-10-07 that live in the database (shared by both domains):
 *
 *   - Product slugs: golden-sevengreen-peas -> golden-seven-green-peas,
 *                    golden-even-reen-peas-carrot -> golden-seven-green-peas-carrot
 *   - Category slug: frensh-fries -> french-fries (EN name "Frensh Fries" -> "French Fries")
 *   - Product EN names: "Frensh Fries" -> "French Fries"
 *   - Category AR names: "مجمده" -> "مجمدة"; brand AR names + SiteSetting AR site name -> "جولدن سفن"
 *   - Page Builder content (draft PageSection rows AND each page's published PageRevision snapshot):
 *     links to the old slugs, "مجمده" -> "مجمدة", "جولدن سيفين/سيفن" -> "جولدن سفن"
 *
 * The old URLs keep working through permanent redirects in code (src/lib/seo/legacy-slugs.ts), so
 * run this BEFORE deploying that code -- otherwise an old URL redirects to a slug that doesn't exist yet.
 *
 *   npx tsx scripts/fix-seo-slugs.ts            # dry run: prints every change, writes nothing
 *   npx tsx scripts/fix-seo-slugs.ts --apply    # writes the changes (one transaction)
 *
 * Uses whatever DATABASE_URL is in the environment -- run it against production only deliberately.
 * Idempotent: a second run finds nothing to change.
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { normalizeBrandSpelling } from "../src/lib/brand";
import { LEGACY_CATEGORY_SLUGS, LEGACY_PRODUCT_SLUGS } from "../src/lib/seo/legacy-slugs";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

const fixFrozen = (text: string) => text.replace(/مجمده(?=\s|$|[.،,"<])/g, "مجمدة");
const fixFrensh = (text: string) => text.replace(/\bFrensh\b/g, "French").replace(/\bfrensh\b/g, "french");

/** Text fixes for free content: brand spelling, ة, and links to the renamed slugs. */
function fixContentText(text: string): string {
  let next = fixFrozen(normalizeBrandSpelling(text));
  for (const [from, to] of Object.entries(LEGACY_PRODUCT_SLUGS)) {
    next = next.replace(new RegExp(`/products/${from}(?=$|[/?#"'\\s])`, "g"), `/products/${to}`);
  }
  for (const [from, to] of Object.entries(LEGACY_CATEGORY_SLUGS)) {
    next = next.replace(new RegExp(`([?&]category=)${from}(?=$|[&#"'\\s])`, "g"), `$1${to}`);
  }
  return next;
}

/** Applies `fix` to every string inside a JSON value; returns the new value and what changed. */
function fixJson(value: unknown, fix: (s: string) => string, diffs: string[]): unknown {
  if (typeof value === "string") {
    const next = fix(value);
    if (next !== value) diffs.push(`"${value.slice(0, 70)}" -> "${next.slice(0, 70)}"`);
    return next;
  }
  if (Array.isArray(value)) return value.map((item) => fixJson(item, fix, diffs));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fixJson(v, fix, diffs)]));
  }
  return value;
}

async function main() {
  const changes: { what: string; detail: string; run: () => Prisma.PrismaPromise<unknown> }[] = [];

  for (const [from, to] of Object.entries(LEGACY_PRODUCT_SLUGS)) {
    const product = await prisma.product.findUnique({ where: { slug: from }, select: { id: true } });
    if (!product) continue;
    if (await prisma.product.findUnique({ where: { slug: to }, select: { id: true } })) throw new Error(`Target product slug "${to}" already exists`);
    changes.push({ what: "product slug", detail: `${from} -> ${to}`, run: () => prisma.product.update({ where: { id: product.id }, data: { slug: to } }) });
  }

  for (const [from, to] of Object.entries(LEGACY_CATEGORY_SLUGS)) {
    const category = await prisma.category.findUnique({ where: { slug: from }, select: { id: true } });
    if (!category) continue;
    if (await prisma.category.findUnique({ where: { slug: to }, select: { id: true } })) throw new Error(`Target category slug "${to}" already exists`);
    changes.push({ what: "category slug", detail: `${from} -> ${to}`, run: () => prisma.category.update({ where: { id: category.id }, data: { slug: to } }) });
  }

  for (const t of await prisma.categoryTranslation.findMany({ select: { id: true, name: true, locale: true } })) {
    const next = (t.locale === "AR" ? fixFrozen(t.name) : fixFrensh(t.name)).replace(/\s+$/, "");
    if (next !== t.name) changes.push({ what: `category name (${t.locale})`, detail: `"${t.name}" -> "${next}"`, run: () => prisma.categoryTranslation.update({ where: { id: t.id }, data: { name: next } }) });
  }

  for (const t of await prisma.productTranslation.findMany({ where: { locale: "EN" }, select: { id: true, name: true } })) {
    const next = fixFrensh(t.name);
    if (next !== t.name) changes.push({ what: "product name (EN)", detail: `"${t.name}" -> "${next}"`, run: () => prisma.productTranslation.update({ where: { id: t.id }, data: { name: next } }) });
  }

  for (const t of await prisma.brandTranslation.findMany({ where: { locale: "AR" }, select: { id: true, name: true } })) {
    const next = normalizeBrandSpelling(t.name);
    if (next !== t.name) changes.push({ what: "brand name (AR)", detail: `"${t.name}" -> "${next}"`, run: () => prisma.brandTranslation.update({ where: { id: t.id }, data: { name: next } }) });
  }

  const settings = await prisma.siteSetting.findUnique({ where: { id: "singleton" }, select: { siteNameAr: true } });
  if (settings?.siteNameAr) {
    const next = normalizeBrandSpelling(settings.siteNameAr);
    if (next !== settings.siteNameAr) changes.push({ what: "site name (AR)", detail: `"${settings.siteNameAr}" -> "${next}"`, run: () => prisma.siteSetting.update({ where: { id: "singleton" }, data: { siteNameAr: next } }) });
  }

  // Page Builder content: the draft rows the builder edits...
  for (const section of await prisma.pageSection.findMany({ select: { id: true, type: true, dataAr: true, dataEn: true, page: { select: { slug: true } } } })) {
    const diffs: string[] = [];
    const dataAr = fixJson(section.dataAr, fixContentText, diffs);
    const dataEn = fixJson(section.dataEn, fixContentText, diffs);
    if (diffs.length) {
      changes.push({
        what: `section draft ${section.page.slug} ${section.type}`,
        detail: diffs.join("\n      "),
        run: () => prisma.pageSection.update({ where: { id: section.id }, data: { dataAr: dataAr as Prisma.InputJsonValue, dataEn: dataEn as Prisma.InputJsonValue } }),
      });
    }
  }
  // ...and the published snapshot visitors see (older, unpublished revisions stay as history).
  for (const revision of await prisma.pageRevision.findMany({ where: { isPublished: true }, select: { id: true, snapshot: true, page: { select: { slug: true } } } })) {
    const diffs: string[] = [];
    const snapshot = fixJson(revision.snapshot, fixContentText, diffs);
    if (diffs.length) {
      changes.push({
        what: `published snapshot ${revision.page.slug}`,
        detail: diffs.join("\n      "),
        run: () => prisma.pageRevision.update({ where: { id: revision.id }, data: { snapshot: snapshot as Prisma.InputJsonValue } }),
      });
    }
  }

  if (changes.length === 0) {
    console.log("Nothing to change.");
    return;
  }
  for (const c of changes) console.log(`${c.what}:\n      ${c.detail}`);
  if (!apply) {
    console.log(`\nDry run -- ${changes.length} change(s), nothing written. Re-run with --apply.`);
    return;
  }
  await prisma.$transaction(changes.map((c) => c.run()));
  console.log(`\nApplied ${changes.length} change(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
