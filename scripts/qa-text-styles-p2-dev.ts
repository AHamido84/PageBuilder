/**
 * DEV ONLY -- disposable QA page for text styling P2 (page-builder blocks). Publishes
 * /ar/qa-text-styles-p2 (+ /en) with one section per covered block type, each with a styled heading
 * and a styled text inside a list item / nested object where the block has one.
 *
 *   npx tsx scripts/qa-text-styles-p2-dev.ts            # create / refresh (idempotent)
 *   npx tsx scripts/qa-text-styles-p2-dev.ts --cleanup  # delete the page (sections + revisions cascade)
 *
 * Refuses to run against the production database host.
 */
import { PrismaClient } from "@prisma/client";
import { getBlock } from "../src/lib/page-builder/registry";
import type { RichText } from "../src/lib/text-style/rich-text";

const PROD_HOST = "ep-quiet-band";
const SLUG = "qa-text-styles-p2";
const prisma = new PrismaClient();

/** Whole field gold + bold, and the word "QA" teal + larger. */
function styled(text: string): RichText {
  const [first, ...rest] = text.split(" ");
  return {
    v: 1,
    style: { color: "gold", bold: true },
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: first, marks: [{ type: "textStyle", attrs: { color: "teal", fontSize: "xl" } }] }, ...(rest.length ? [{ type: "text" as const, text: " " + rest.join(" ") }] : [])],
        },
      ],
    },
  };
}
const withRich = <T extends Record<string, unknown>>(obj: T, ...keys: (keyof T & string)[]) => ({ ...obj, __rich: Object.fromEntries(keys.map((k) => [k, styled(String(obj[k]))])) });

const item = (title: string, body: string) => withRich({ title, body }, "title");

const SECTIONS: { type: string; data: Record<string, unknown> }[] = [
  { type: "HEADING", data: withRich({ text: "QA heading block", level: "h2" }, "text") },
  { type: "PAGE_INTRO", data: withRich({ eyebrow: "QA eyebrow", title: "QA page intro", description: "QA description text" }, "eyebrow", "title", "description") },
  { type: "STATISTICS", data: withRich({ heading: "QA statistics", items: [withRich({ value: "120+", label: "QA partners", icon: "none" }, "label")] }, "heading") },
  { type: "TESTIMONIALS", data: withRich({ heading: "QA testimonials", items: [withRich({ quote: "QA quote text", authorName: "QA author", authorRole: "Role", avatar: null }, "quote", "authorName")] }, "heading") },
  { type: "TIMELINE", data: withRich({ heading: "QA timeline", layout: "list", items: [withRich({ date: "2026", title: "QA step", body: "Step body", image: null }, "title")] }, "heading") },
  { type: "FAQ", data: withRich({ heading: "QA faq", items: [item("QA question", "QA answer")] }, "heading") },
  { type: "TABS", data: withRich({ heading: "QA tabs", items: [item("QA tab", "Tab body")] }, "heading") },
  { type: "FEATURE_CARDS", data: withRich({ heading: "QA feature cards", items: [item("QA card", "Card body")] }, "heading") },
  { type: "ICON_CARDS", data: withRich({ heading: "QA icon cards", items: [withRich({ icon: "star", title: "QA icon card", body: "Body", link: "", image: null, ctaLabel: "" }, "title")] }, "heading") },
  { type: "TWO_COLUMNS", data: { items: [withRich({ heading: "QA column", body: "Column body", image: null, linkUrl: "", linkLabel: "" }, "heading", "body")] } },
  { type: "IMAGE_TEXT", data: withRich({ heading: "QA image text", body: "QA body", image: null, imagePosition: "left", ctaLabel: "QA button", ctaUrl: "/contact" }, "heading", "ctaLabel") },
  { type: "CTA", data: withRich({ heading: "QA cta", body: "QA body", ctaLabel: "QA button", ctaUrl: "/contact", layout: "centered", image: null }, "heading", "ctaLabel") },
  { type: "BANNER", data: withRich({ eyebrow: "QA eyebrow", heading: "QA banner", body: "QA body", ctaLabel: "QA button", ctaUrl: "/contact" }, "eyebrow", "heading", "ctaLabel") },
  { type: "NEWSLETTER", data: withRich({ heading: "QA newsletter", body: "QA body", submitLabel: "QA subscribe", layout: "panel" }, "heading", "submitLabel") },
  { type: "CONTACT_FORM", data: withRich({ heading: "QA contact form", body: "QA body", nameLabel: "QA name", showMessage: true }, "heading", "nameLabel") },
  { type: "PRODUCT_GRID", data: withRich({ heading: "QA product grid", promo: withRich({ enabled: true, eyebrow: "QA promo", title: "QA promo title", body: "Promo body", ctaLabel: "QA promo button", ctaUrl: "/contact", position: 1 }, "title", "ctaLabel") }, "heading") },
  { type: "HERO", data: withRich({ eyebrow: "QA hero eyebrow", headline: "QA hero headline", subheading: "QA hero text" }, "eyebrow", "headline", "subheading") },
  // feat/products-page-builder: the quote form's products dropdown and the contact-details card alignment.
  { type: "G7_QUOTE", data: {} },
  { type: "CONTACT_INFO", data: { heading: "بيانات التواصل" } },
];

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (url.includes(PROD_HOST)) throw new Error("Refusing to run: DATABASE_URL points at the production database.");

  if (process.argv.includes("--cleanup")) {
    const { count } = await prisma.page.deleteMany({ where: { slug: SLUG } });
    console.log(`Deleted ${count} QA page(s).`);
    return;
  }

  const rows = SECTIONS.map(({ type, data }, order) => {
    const block = getBlock(type);
    if (!block) throw new Error(`Unknown block ${type}`);
    // Defaults are per locale ({ en, ar }) for most blocks.
    const defaults = structuredClone(block.defaultData) as { en?: object; ar?: object };
    const dataEn = { ...(defaults.en ?? defaults), ...data };
    const dataAr = { ...(defaults.ar ?? defaults), ...data };
    for (const d of [dataEn, dataAr]) if (!block.dataSchema.safeParse(d).success) throw new Error(`${type}: QA data does not validate`);
    return { type, order, dataEn, dataAr, settings: block.defaultSettings, isVisible: true };
  });

  const page = await prisma.page.upsert({ where: { slug: SLUG }, update: {}, create: { slug: SLUG, status: "DRAFT", titleEn: "QA text styles P2", titleAr: "QA text styles P2" } });
  await prisma.pageSection.deleteMany({ where: { pageId: page.id } });
  await prisma.pageSection.createMany({ data: rows.map((r) => ({ ...r, pageId: page.id, dataEn: r.dataEn as object, dataAr: r.dataAr as object, settings: r.settings as object })) });
  const fresh = await prisma.pageSection.findMany({ where: { pageId: page.id }, orderBy: { order: "asc" } });
  const snapshot = fresh.map((s) => ({ id: s.id, type: s.type, order: s.order, dataEn: s.dataEn, dataAr: s.dataAr, settings: s.settings, isVisible: s.isVisible }));
  await prisma.$transaction(async (tx) => {
    await tx.pageRevision.updateMany({ where: { pageId: page.id, isPublished: true }, data: { isPublished: false } });
    await tx.pageRevision.create({ data: { pageId: page.id, isPublished: true, note: "QA text styles P2", snapshot: { sections: snapshot } } });
    await tx.page.update({ where: { id: page.id }, data: { status: "PUBLISHED", publishedAt: new Date() } });
  });
  console.log(`QA page published: /ar/${SLUG} (${rows.length} sections).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
