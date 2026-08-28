/**
 * Converts /quality-food-safety from a hardcoded React route (src/components/site/info-page.tsx,
 * namespace="quality") into a real Page Builder page (slug "quality-food-safety", unchanged URL) --
 * same pattern as seed-about-page.ts / seed-contact-page.ts. Every string is copied verbatim from
 * messages/en.json / ar.json's `quality` and `home` namespaces -- nothing invented.
 *
 * Adds a Certifications Grid section (new CERTIFICATIONS_GRID block, see
 * src/lib/page-builder/blocks/commerce/certifications-grid.tsx) that the old hardcoded page never
 * had -- it surfaces the existing Certification model, which had no public-facing display anywhere
 * before this. Genuinely new content (a real gap the old page had), not a migrated string.
 *
 * ICON_CARDS' fixed icon vocabulary (see ICON_OPTIONS in
 * src/lib/page-builder/blocks/social-proof/icon-cards.tsx) has exact matches for two of the old
 * page's three icons (Thermometer -> "thermometer", Truck -> "truck"); the third (FileText, for
 * "Documentation") has no exact match -- "shield" is the closest available stand-in. Decorative only.
 *
 * Run: npx tsx scripts/seed-quality-page.ts
 */
import { prisma } from "../src/lib/prisma";
import { defaultSectionSettings } from "../src/lib/page-builder/types";

const QUALITY_SLUG = "quality-food-safety";

interface SectionSeed {
  type: string;
  dataEn: unknown;
  dataAr: unknown;
  settings: ReturnType<typeof defaultSectionSettings>;
}

const sections: SectionSeed[] = [
  {
    type: "HERO",
    dataEn: {
      eyebrow: "Quality & food safety",
      headline: "Handled to the standard the product requires",
      subheading: "Food safety, for a distributor, is mostly a logistics problem: keeping frozen product frozen, chilled product chilled, and ambient product properly stored, without a break in the chain between receiving and delivery.",
      ctaVisible: false,
      mediaType: "image",
    },
    dataAr: {
      eyebrow: "الجودة وسلامة الغذاء",
      headline: "يُدار وفق المعيار الذي يتطلبه المنتج",
      subheading: "سلامة الغذاء، بالنسبة لموزّع، هي في الأساس مسألة لوجستية: إبقاء المنتج المجمد مجمدًا، والمبرد مبردًا، وحفظ المنتج العادي بشكل صحيح، دون انقطاع في السلسلة بين الاستلام والتسليم.",
      ctaVisible: false,
      mediaType: "image",
    },
    settings: defaultSectionSettings({ background: "paper", desktop: { paddingY: "xl", marginY: "none", align: "center", columns: "1", headingSize: "2xl", bodySize: "md", visible: true } }),
  },
  {
    type: "ICON_CARDS",
    dataEn: {
      heading: "",
      items: [
        { icon: "thermometer", title: "Temperature-class separation", body: "Every product we handle is classified frozen, chilled, or ambient, and stored accordingly. Categories aren't mixed in storage or in transit." },
        { icon: "truck", title: "Receiving to delivery", body: "The same temperature discipline that applies in our storage applies through loading and delivery — the chain doesn't break at the loading dock." },
        { icon: "shield", title: "Documentation", body: "Product origin and specification data is tracked per SKU, so customers know what they're receiving and where it came from." },
      ],
    },
    dataAr: {
      heading: "",
      items: [
        { icon: "thermometer", title: "فصل حسب فئة درجة الحرارة", body: "كل منتج نتعامل معه مصنّف كمجمد أو مبرد أو عادي، ويُخزَّن وفقًا لذلك. لا تُخلط الفئات في التخزين أو النقل." },
        { icon: "truck", title: "من الاستلام حتى التسليم", body: "نفس انضباط درجة الحرارة المتّبع في مخازننا يُطبَّق أثناء التحميل والتسليم — لا تنقطع السلسلة عند رصيف التحميل." },
        { icon: "shield", title: "التوثيق", body: "تُتابَع بيانات منشأ المنتج ومواصفاته لكل رمز صنف، ليعرف العملاء ما يستلمونه ومصدره." },
      ],
    },
    settings: defaultSectionSettings({ background: "frost", desktop: { paddingY: "lg", marginY: "none", align: "left", columns: "3", headingSize: "lg", bodySize: "md", visible: true } }),
  },
  {
    type: "CERTIFICATIONS_GRID",
    dataEn: { heading: "Certifications" },
    dataAr: { heading: "الشهادات" },
    settings: defaultSectionSettings({ background: "paper" }),
  },
  {
    type: "CTA",
    dataEn: { heading: "Tell us what your operation needs", body: "Send us your product categories and order volumes — a member of our team will follow up with what we can supply and when.", ctaLabel: "Request a quote", ctaUrl: "/contact" },
    dataAr: { heading: "أخبرنا بما تحتاجه عمليتك", body: "أرسل لنا فئات المنتجات وأحجام الطلبات — سيتواصل معك أحد أعضاء فريقنا بما يمكننا توفيره وموعده.", ctaLabel: "اطلب عرض سعر", ctaUrl: "/contact" },
    settings: defaultSectionSettings({ background: "ink", desktop: { paddingY: "lg", marginY: "none", align: "center", columns: "1", headingSize: "xl", bodySize: "md", visible: true } }),
  },
];

async function main() {
  const page = await prisma.page.upsert({
    where: { slug: QUALITY_SLUG },
    update: {},
    create: { slug: QUALITY_SLUG, status: "DRAFT" },
  });

  await prisma.pageSection.deleteMany({ where: { pageId: page.id } });
  await prisma.pageSection.createMany({
    data: sections.map((s, order) => ({
      pageId: page.id,
      type: s.type,
      order,
      dataEn: s.dataEn as object,
      dataAr: s.dataAr as object,
      settings: s.settings as object,
      isVisible: true,
    })),
  });

  const freshSections = await prisma.pageSection.findMany({ where: { pageId: page.id }, orderBy: { order: "asc" } });
  const snapshotSections = freshSections.map((s) => ({
    id: s.id,
    type: s.type,
    order: s.order,
    dataEn: s.dataEn,
    dataAr: s.dataAr,
    settings: s.settings,
    isVisible: s.isVisible,
  }));

  await prisma.$transaction(async (tx) => {
    await tx.pageRevision.updateMany({ where: { pageId: page.id, isPublished: true }, data: { isPublished: false } });
    await tx.pageRevision.create({
      data: { pageId: page.id, isPublished: true, note: "Initial quality page seed", snapshot: { sections: snapshotSections } },
    });
    await tx.page.update({ where: { id: page.id }, data: { status: "PUBLISHED", publishedAt: new Date() } });
  });

  console.log(`Quality page seeded and published: ${sections.length} sections, page id ${page.id}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
