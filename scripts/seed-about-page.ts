/**
 * Converts /about from a hardcoded React route into a real Page Builder page (slug "about",
 * unchanged URL) -- same upsert-and-replace-sections pattern as seed-contact-page.ts /
 * seed-solutions.ts. Every string below is copied verbatim from messages/en.json / ar.json's
 * `about` and `home` namespaces, the exact source the old hardcoded page read from -- nothing
 * invented.
 *
 * ICON_CARDS only supports a fixed icon vocabulary (see ICON_OPTIONS in
 * src/lib/page-builder/blocks/social-proof/icon-cards.tsx) smaller than the raw lucide-react icons
 * the old page used directly (Target/Eye for Mission/Vision; CheckCircle2/ShieldCheck/Crosshair/
 * Handshake for Values) -- "shield"/"snowflake"/"award"/"handshake" are the closest available
 * stand-ins. Purely decorative, not a content change.
 *
 * The old page's per-section "eyebrow" labels (storyEyebrow, valuesEyebrow, processEyebrow,
 * whyEyebrow) have no equivalent field on the HEADING/ICON_CARDS/TIMELINE blocks used here, so
 * they're dropped -- a small design-flourish loss, not a content loss (every title/body string is
 * still present).
 *
 * The closing CTA is built as a HERO section (not a CTA block) specifically because the old page's
 * closing CTA had two buttons (primary "Request a quote" + secondary "Browse products") and HERO is
 * the only block with two independently-labeled CTAs -- preserves both buttons exactly.
 *
 * Run: npx tsx scripts/seed-about-page.ts
 */
import { prisma } from "../src/lib/prisma";
import { defaultSectionSettings } from "../src/lib/page-builder/types";

const ABOUT_SLUG = "about";

const CTA_LABEL_EN = "Request a quote";
const CTA_LABEL_AR = "اطلب عرض سعر";
const CTA_LABEL2_EN = "Browse products";
const CTA_LABEL2_AR = "تصفح المنتجات";

const WHY_ITEMS_EN = [
  { icon: "snowflake", title: "Cold-chain discipline", body: "Frozen, chilled, and ambient product handled and stored to its required temperature class, every step from receiving to delivery." },
  { icon: "package", title: "Full-catalog distribution", body: "One supplier across frozen, chilled, and ambient goods, instead of coordinating separate vendors for each category." },
  { icon: "handshake", title: "Built for foodservice", body: "Order volumes and delivery schedules built around hotels, restaurants, catering, and hospitals — not retail shelves." },
  { icon: "globe", title: "Jeddah-based, Saudi-wide", body: "Operating from Jeddah with distribution reach across the Kingdom." },
];
const WHY_ITEMS_AR = [
  { icon: "snowflake", title: "انضباط سلسلة التبريد", body: "تُدار المنتجات المجمدة والمبردة والعادية وتُخزَّن وفق درجة الحرارة المطلوبة، في كل خطوة من الاستلام حتى التسليم." },
  { icon: "package", title: "توزيع بكامل الكتالوج", body: "مورّد واحد للمنتجات المجمدة والمبردة والعادية، بدلًا من التنسيق مع موردين منفصلين لكل فئة." },
  { icon: "handshake", title: "مصمم لقطاع الأغذية", body: "أحجام الطلبات وجداول التسليم مبنية حول الفنادق والمطاعم وشركات التموين والمستشفيات، لا رفوف التجزئة." },
  { icon: "globe", title: "مقرّنا جدة، وتغطيتنا المملكة", body: "نعمل من جدة مع تغطية توزيع تمتد عبر أنحاء المملكة." },
];

interface SectionSeed {
  type: string;
  dataEn: unknown;
  dataAr: unknown;
  settings: ReturnType<typeof defaultSectionSettings>;
}

const sections: SectionSeed[] = [
  {
    type: "HERO",
    dataEn: { eyebrow: "Company", headline: "About Seven Eleven Trading", ctaVisible: false, mediaType: "image" },
    dataAr: { eyebrow: "الشركة", headline: "عن سفن إليفن للتجارة", ctaVisible: false, mediaType: "image" },
    settings: defaultSectionSettings({ background: "paper", desktop: { paddingY: "xl", marginY: "none", align: "center", columns: "1", headingSize: "2xl", bodySize: "md", visible: true } }),
  },
  {
    type: "HEADING",
    dataEn: { text: "A trading company built on one core business", level: "h2" },
    dataAr: { text: "شركة تجارية قائمة على نشاط أساسي واحد", level: "h2" },
    settings: defaultSectionSettings({ background: "paper" }),
  },
  {
    type: "RICH_TEXT",
    dataEn: { html: "<p>Seven Eleven Trading is a wholesale import and export company based in Jeddah, Saudi Arabia. Our core business is distributing food products to the businesses that depend on a steady, correctly-handled supply — hotels, restaurants, catering companies, hospitals, and wholesale markets across the Kingdom.</p>" },
    dataAr: { html: "<p>سفن إليفن للتجارة شركة استيراد وتصدير بالجملة مقرها جدة، المملكة العربية السعودية. نشاطنا الأساسي هو توزيع المنتجات الغذائية للشركات التي تعتمد على إمداد ثابت ومُدار بشكل صحيح — الفنادق والمطاعم وشركات التموين والمستشفيات وأسواق الجملة في جميع أنحاء المملكة.</p>" },
    settings: defaultSectionSettings({ background: "paper" }),
  },
  {
    type: "ICON_CARDS",
    dataEn: {
      heading: "",
      items: [
        { icon: "star", title: "Mission", body: "To give foodservice and hospitality businesses across Saudi Arabia dependable access to frozen, chilled, and ambient products — sourced responsibly and delivered on schedule." },
        { icon: "globe", title: "Vision", body: "To be a trusted name in food distribution across the Kingdom, known for reliability as much as range." },
      ],
    },
    dataAr: {
      heading: "",
      items: [
        { icon: "star", title: "رسالتنا", body: "تمكين شركات قطاع الأغذية والضيافة في المملكة العربية السعودية من الوصول الموثوق إلى المنتجات المجمدة والمبردة والعادية — مُوردة بمسؤولية ومُسلَّمة في موعدها." },
        { icon: "globe", title: "رؤيتنا", body: "أن نكون اسمًا موثوقًا في التوزيع الغذائي عبر المملكة، معروفين بالموثوقية بقدر تنوع منتجاتنا." },
      ],
    },
    settings: defaultSectionSettings({ background: "ink", desktop: { paddingY: "lg", marginY: "none", align: "left", columns: "2", headingSize: "lg", bodySize: "md", visible: true } }),
  },
  {
    type: "ICON_CARDS",
    dataEn: {
      heading: "Values",
      items: [
        { icon: "shield", title: "Reliability", body: "Orders arrive complete and on schedule — the baseline our customers plan around." },
        { icon: "snowflake", title: "Food safety", body: "Temperature class is treated as a handling requirement, not a label." },
        { icon: "award", title: "Precision", body: "Right SKU, right quantity, right documentation — every time." },
        { icon: "handshake", title: "Partnership", body: "We work to our customers' order patterns, not the other way around." },
      ],
    },
    dataAr: {
      heading: "قيمنا",
      items: [
        { icon: "shield", title: "الموثوقية", body: "تصل الطلبات كاملة وفي موعدها — الأساس الذي يخطط عملاؤنا حوله." },
        { icon: "snowflake", title: "سلامة الغذاء", body: "تُعامل فئة درجة الحرارة كمتطلب تشغيلي، لا مجرد توصيف." },
        { icon: "award", title: "الدقة", body: "رمز الصنف الصحيح، والكمية الصحيحة، والمستندات الصحيحة — في كل مرة." },
        { icon: "handshake", title: "الشراكة", body: "نعمل وفق نمط طلب عملائنا، لا العكس." },
      ],
    },
    settings: defaultSectionSettings({ background: "paper", desktop: { paddingY: "lg", marginY: "none", align: "left", columns: "4", headingSize: "lg", bodySize: "md", visible: true } }),
  },
  {
    type: "TIMELINE",
    dataEn: {
      heading: "From sourcing to delivery",
      layout: "list",
      items: [
        { title: "Sourcing & import", body: "Product is sourced internationally and locally against category and temperature-class requirements." },
        { title: "Cold storage", body: "Held in temperature-controlled storage, separated by class — frozen, chilled, and ambient." },
        { title: "Distribution", body: "Delivered across Saudi Arabia on schedules built around foodservice and hospitality operations." },
      ],
    },
    dataAr: {
      heading: "من التوريد إلى التسليم",
      layout: "list",
      items: [
        { title: "التوريد والاستيراد", body: "يتم توريد المنتج محليًا ودوليًا وفق متطلبات الفئة ودرجة الحرارة." },
        { title: "التخزين المبرّد", body: "يُحفظ في تخزين مُتحكَّم بدرجة الحرارة، منفصلًا حسب الفئة — مجمد ومبرد وعادي." },
        { title: "التوزيع", body: "يُسلَّم في جميع أنحاء المملكة وفق جداول مبنية حول عمليات قطاع الأغذية والضيافة." },
      ],
    },
    settings: defaultSectionSettings({ background: "frost" }),
  },
  {
    type: "ICON_CARDS",
    dataEn: { heading: "Why businesses order from Seven Eleven Trading", items: WHY_ITEMS_EN },
    dataAr: { heading: "لماذا تطلب الشركات من سفن إليفن للتجارة", items: WHY_ITEMS_AR },
    settings: defaultSectionSettings({ background: "paper", desktop: { paddingY: "lg", marginY: "none", align: "left", columns: "4", headingSize: "lg", bodySize: "md", visible: true } }),
  },
  {
    type: "HERO",
    dataEn: {
      headline: "Talk to our team",
      subheading: "Tell us what your operation needs and we'll follow up with what we can supply.",
      ctaLabel: CTA_LABEL_EN,
      ctaUrl: "/contact",
      ctaVisible: true,
      ctaLabel2: CTA_LABEL2_EN,
      ctaUrl2: "/products",
      ctaVisible2: true,
      mediaType: "image",
    },
    dataAr: {
      headline: "تحدث إلى فريقنا",
      subheading: "أخبرنا بما تحتاجه عمليتك وسنتواصل معك بما يمكننا توفيره.",
      ctaLabel: CTA_LABEL_AR,
      ctaUrl: "/contact",
      ctaVisible: true,
      ctaLabel2: CTA_LABEL2_AR,
      ctaUrl2: "/products",
      ctaVisible2: true,
      mediaType: "image",
    },
    settings: defaultSectionSettings({ background: "ink", desktop: { paddingY: "xl", marginY: "none", align: "center", columns: "1", headingSize: "2xl", bodySize: "md", visible: true } }),
  },
];

async function main() {
  const page = await prisma.page.upsert({
    where: { slug: ABOUT_SLUG },
    update: {},
    create: { slug: ABOUT_SLUG, status: "DRAFT" },
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
      data: { pageId: page.id, isPublished: true, note: "Initial about page seed", snapshot: { sections: snapshotSections } },
    });
    await tx.page.update({ where: { id: page.id }, data: { status: "PUBLISHED", publishedAt: new Date() } });
  });

  console.log(`About page seeded and published: ${sections.length} sections, page id ${page.id}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
