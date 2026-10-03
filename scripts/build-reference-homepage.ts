/**
 * Rebuilds the homepage DRAFT in the section order of the "Home Page7 - Matched Cards" design
 * reference, entirely from Page Builder data. Nothing goes live: it only rewrites the draft rows
 * (PageSection); the published homepage keeps showing until someone clicks Publish in the builder,
 * and the previous version stays restorable from the builder's Revision history.
 *
 * Existing approved copy is reused wherever the current homepage already has a section for that
 * slot (matched by type + heading). Only the genuinely new sections (Category Discovery, the
 * product-grid promo card, the quote-form side panel, Newsletter) use the reference's wording.
 *
 *   npx tsx scripts/build-reference-homepage.ts            # writes the draft
 *   npx tsx scripts/build-reference-homepage.ts --dry-run  # prints the plan, writes nothing
 *
 * Uses whatever DATABASE_URL is in the environment -- run it against production only deliberately.
 */
import { randomUUID } from "node:crypto";
import { PrismaClient, type Prisma } from "@prisma/client";
import { getBlock } from "../src/lib/page-builder/registry";
import { HOMEPAGE_SLUG } from "../src/lib/page-builder/homepage";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

type Data = Record<string, unknown>;
interface Existing {
  type: string;
  dataEn: Data;
  dataAr: Data;
  settings: Prisma.JsonValue;
}
interface PlannedSection {
  label: string;
  type: string;
  dataEn: Data;
  dataAr: Data;
  settings?: Prisma.JsonValue;
  isVisible?: boolean;
}

async function main() {
  const page = await prisma.page.findUnique({ where: { slug: HOMEPAGE_SLUG }, include: { sections: { orderBy: { order: "asc" } } } });
  if (!page) throw new Error(`No homepage page (${HOMEPAGE_SLUG}) found.`);
  const existing: Existing[] = page.sections.map((s) => ({ type: s.type, dataEn: s.dataEn as Data, dataAr: s.dataAr as Data, settings: s.settings }));

  /** First existing section of a type whose English heading contains `match` (or any, if no match given). */
  const take = (type: string, match?: string): Existing | undefined => {
    const i = existing.findIndex((s) => s.type === type && (!match || String(s.dataEn.heading ?? s.dataEn.headline ?? "").includes(match)));
    return i === -1 ? undefined : existing.splice(i, 1)[0];
  };
  const fresh = (type: string, en: Data, ar: Data): PlannedSection => {
    const block = getBlock(type);
    if (!block) throw new Error(`Unknown block ${type}`);
    return { label: type, type, dataEn: { ...structuredClone(block.defaultData.en), ...en }, dataAr: { ...structuredClone(block.defaultData.ar), ...ar } };
  };
  const reuse = (found: Existing | undefined, type: string, fallbackEn: Data, fallbackAr: Data, patchEn: Data = {}, patchAr: Data = {}): PlannedSection =>
    found
      ? { label: type, type, dataEn: { ...found.dataEn, ...patchEn }, dataAr: { ...found.dataAr, ...patchAr }, settings: found.settings }
      : fresh(type, { ...fallbackEn, ...patchEn }, { ...fallbackAr, ...patchAr });

  const heroMediaEn = await prisma.media.findFirst({ where: { originalName: "hero-default-en.png" }, select: { id: true, url: true } });
  const heroMediaAr = await prisma.media.findFirst({ where: { originalName: "hero-default-ar.png" }, select: { id: true, url: true } });
  const asideEn = heroMediaEn ? { id: heroMediaEn.id, url: heroMediaEn.url } : null;
  const asideAr = heroMediaAr ? { id: heroMediaAr.id, url: heroMediaAr.url } : asideEn;

  const plan: PlannedSection[] = [];

  // 1. Hero -- existing copy and CTAs; a single product image (the dev hero slideshow had no slides).
  plan.push(
    reuse(
      take("HERO"),
      "HERO",
      { headline: "A taste worthy of your hospitality.", ctaLabel: "Request a quote", ctaUrl: "/contact" },
      { headline: "مذاق يليق بضيافتك.", ctaLabel: "اطلب عرض سعر", ctaUrl: "/contact" },
      heroMediaEn ? { mediaType: "image", desktopMediaId: heroMediaEn.id, mobileMediaId: "" } : {},
      heroMediaAr || heroMediaEn ? { mediaType: "image", desktopMediaId: (heroMediaAr ?? heroMediaEn)!.id, mobileMediaId: "" } : {}
    )
  );
  // 2. Introduction
  plan.push(reuse(take("IMAGE_TEXT"), "IMAGE_TEXT", { heading: "A general trading company built around one core business: food." }, { heading: "شركة تجارة عامة قائمة على نشاط أساسي واحد: الغذاء" }));
  // 3. Category Discovery -- new: compact category links.
  plan.push(
    fresh(
      "CATEGORY_GRID",
      { heading: "Discover our products", description: "", mode: "all", layout: "chips", limit: 8 },
      { heading: "اكتشف منتجاتنا", description: "", mode: "all", layout: "chips", limit: 8 }
    )
  );
  // 4. Product Categories (bento)
  plan.push(reuse(take("CATEGORY_GRID"), "CATEGORY_GRID", { heading: "Product categories" }, { heading: "فئات المنتجات" }));
  // 5. Quote CTA
  plan.push(reuse(take("CTA", "Tell us"), "CTA", { heading: "Tell us what your operation needs", ctaLabel: "Request a quote", ctaUrl: "/contact" }, { heading: "أخبرنا بما تحتاجه عمليتك", ctaLabel: "اطلب عرض سعر", ctaUrl: "/contact" }));
  // 6. Featured Products -- featured mode, category chips, promo card (reference wording).
  plan.push(
    reuse(
      take("PRODUCT_GRID"),
      "PRODUCT_GRID",
      { heading: "Featured products" },
      { heading: "منتجات مختارة" },
      {
        mode: "featured",
        limit: 7,
        showCategoryFilter: true,
        promo: { enabled: true, eyebrow: "For your business", title: "Choices that fit your menu.", body: "Share the products and quantities you need, and we'll prepare a supply offer that fits.", ctaLabel: "Request a quote", ctaUrl: "/contact", position: 4 },
      },
      {
        mode: "featured",
        limit: 7,
        showCategoryFilter: true,
        promo: { enabled: true, eyebrow: "لأعمالك", title: "اختيارات تناسب قائمتك.", body: "شاركنا احتياجك من المنتجات والكميات، ودعنا نجهز لك عرض توريد مناسبًا.", ctaLabel: "اطلب عرض سعر", ctaUrl: "/contact", position: 4 },
      }
    )
  );
  // 7. Brands
  plan.push(reuse(take("BRAND_GRID"), "BRAND_GRID", { heading: "Brands we distribute" }, { heading: "العلامات التجارية التي نوزّعها" }));
  // 8. Story / Value proposition
  plan.push(reuse(take("CTA", "Handled"), "CTA", { heading: "Small details. Unforgettable hospitality." }, { heading: "تفاصيل صغيرة. ضيافة لا تُنسى." }));
  plan.push(reuse(take("ICON_CARDS", "What working"), "ICON_CARDS", { heading: "What working with us actually looks like" }, { heading: "كيف يبدو العمل معنا فعليًا" }));
  // 9. Process
  plan.push(reuse(take("TIMELINE"), "TIMELINE", { heading: "From sourcing to your loading dock" }, { heading: "من التوريد إلى رصيف التحميل لديك" }));
  // 10. Business Segments -- existing segment cards, each linked to its Solution page with a CTA.
  const segments = take("ICON_CARDS", "Built around");
  const SEGMENT_SLUGS = ["hotels", "restaurants", "catering", "hospitals", "wholesale", "retail", "food-service"];
  const withLinks = (items: unknown, cta: string) =>
    (Array.isArray(items) ? items : []).map((item: Data, i: number) => ({ image: null, ...item, link: item.link || (SEGMENT_SLUGS[i] ? `/solutions/${SEGMENT_SLUGS[i]}` : ""), ctaLabel: item.ctaLabel || cta }));
  plan.push(
    reuse(
      segments,
      "ICON_CARDS",
      { heading: "A partner for your kitchen, whatever its size." },
      { heading: "شريك لمطبخك، مهما كان حجمه." },
      segments ? { items: withLinks(segments.dataEn.items, "Learn more") } : {},
      segments ? { items: withLinks(segments.dataAr.items, "اعرف المزيد") } : {}
    )
  );
  // Articles -- not in the reference structure; kept (and visible) so no existing content is lost.
  const news = take("NEWS_GRID");
  if (news) plan.push(reuse(news, "NEWS_GRID", {}, {}));
  // 11. Quote Form -- existing form and its behavior unchanged; presentation from the reference.
  plan.push(
    reuse(
      take("CONTACT_FORM") ?? take("QUOTE_FORM"),
      "CONTACT_FORM",
      { heading: "Get in touch" },
      { heading: "تواصل معنا" },
      { layout: "split", buttonStyle: "gold", aside: { image: asideEn, eyebrow: "Let's grow together", heading: "Let's start a partnership with a special taste.", body: "Natural products, with quality you can trust." } },
      { layout: "split", buttonStyle: "gold", aside: { image: asideAr, eyebrow: "ننمو معًا", heading: "خلّنا نبدأ شراكة بطعم مميز.", body: "منتجات طبيعية بجودة تثق بها." } }
    )
  );
  // 12. Newsletter
  plan.push(fresh("NEWSLETTER", { heading: "Stay in the loop", body: "New products and seasonal offers, a few times a year.", layout: "panel" }, { heading: "ابقَ على اطلاع", body: "منتجات جديدة وعروض موسمية، بضع مرات في السنة.", layout: "panel" }));

  // Anything on the current homepage the plan didn't place is appended, hidden, so nothing is lost.
  for (const leftover of existing) plan.push({ label: `${leftover.type} (unplaced, hidden)`, type: leftover.type, dataEn: leftover.dataEn, dataAr: leftover.dataAr, settings: leftover.settings, isVisible: false });

  // Validate every section against its block schema before writing anything.
  const rows = plan.map((section, order) => {
    const block = getBlock(section.type)!;
    const dataEn = block.dataSchema.parse(section.dataEn);
    const dataAr = block.dataSchema.parse(section.dataAr);
    return {
      id: randomUUID(),
      pageId: page.id,
      type: section.type,
      order,
      dataEn: dataEn as Prisma.InputJsonValue,
      dataAr: dataAr as Prisma.InputJsonValue,
      settings: (section.settings ?? { en: structuredClone(block.defaultSettings), ar: structuredClone(block.defaultSettings) }) as Prisma.InputJsonValue,
      isVisible: section.isVisible ?? true,
    };
  });

  for (const r of rows) console.log(`${String(r.order + 1).padStart(2)}. ${r.type.padEnd(14)} ${r.isVisible ? "" : "(hidden) "}${String((r.dataEn as Data).heading ?? (r.dataEn as Data).headline ?? "")}`);
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
