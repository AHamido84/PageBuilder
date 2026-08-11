/**
 * Creates (or updates) the homepage as a real Page Builder page instead of
 * hardcoded React -- see HANDOFF.md gap #12. Upserts the reserved
 * `__homepage__` Page with ordered PageSections, using the block registry's
 * real types, then publishes it (creates the first PageRevision) so the
 * homepage is immediately live. Rerunnable: replaces the section set on
 * every run rather than duplicating.
 *
 * All copy below is pulled from the already-reviewed `home`/`solutions` i18n
 * namespaces (messages/en.json, messages/ar.json) -- nothing invented. No
 * statistics section is seeded (no real numbers exist yet -- see gap #4/#14
 * "don't invent" rule); the block is available for the admin to add once
 * real data exists.
 *
 * Run: npx tsx scripts/seed-homepage.ts
 */
import { prisma } from "../src/lib/prisma";
import { defaultSectionSettings } from "../src/lib/page-builder/types";
import { HOMEPAGE_SLUG } from "../src/lib/page-builder/homepage";

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
      headline: "Food distribution that treats the cold chain as non-negotiable.",
      subheading:
        "Seven Eleven Trading supplies hotels, restaurants, catering companies, hospitals, and wholesale markets across Saudi Arabia — frozen, chilled, and ambient, handled to the standard each one demands.",
      ctaLabel: "Request a quote",
      ctaUrl: "/contact",
      ctaLabel2: "Browse products",
      ctaUrl2: "/products",
      imageId: "",
    },
    dataAr: {
      headline: "توزيع غذائي تكون فيه سلسلة التبريد غير قابلة للتفاوض.",
      subheading:
        "تزوّد سفن إليفن للتجارة الفنادق والمطاعم وشركات التموين والمستشفيات وأسواق الجملة في جميع أنحاء المملكة — منتجات مجمدة ومبردة وعادية، تُدار وفق المعيار الذي يتطلبه كل نوع.",
      ctaLabel: "اطلب عرض سعر",
      ctaUrl: "/contact",
      ctaLabel2: "تصفح المنتجات",
      ctaUrl2: "/products",
      imageId: "",
    },
    settings: defaultSectionSettings({
      background: "ink",
      desktop: { paddingY: "xl", marginY: "none", align: "center", columns: "1", headingSize: "2xl", bodySize: "md", visible: true },
    }),
  },
  {
    type: "IMAGE_TEXT",
    dataEn: {
      heading: "A general trading company built around one core business: food.",
      body: "Seven Eleven Trading is a Jeddah-based wholesale import and export company. Our core business is distributing food products — sourced internationally and locally, held at the right temperature, and delivered on the schedule foodservice operations depend on.",
      image: null,
      imagePosition: "left",
      ctaLabel: "",
      ctaUrl: "",
    },
    dataAr: {
      heading: "شركة تجارة عامة قائمة على نشاط أساسي واحد: الغذاء",
      body: "سفن إليفن للتجارة شركة استيراد وتصدير بالجملة مقرها جدة. نشاطنا الأساسي هو توزيع المنتجات الغذائية — يتم توريدها محليًا ودوليًا، وحفظها عند درجة الحرارة المناسبة، وتسليمها وفق الجدول الذي تعتمد عليه عمليات قطاع الأغذية.",
      image: null,
      imagePosition: "left",
      ctaLabel: "",
      ctaUrl: "",
    },
    settings: defaultSectionSettings({ background: "frost" }),
  },
  {
    type: "CATEGORY_GRID",
    dataEn: { heading: "Product categories", categoryIds: [] },
    dataAr: { heading: "فئات المنتجات", categoryIds: [] },
    settings: defaultSectionSettings(),
  },
  {
    type: "PRODUCT_GRID",
    dataEn: { heading: "Featured products", categoryId: "", limit: 8 },
    dataAr: { heading: "منتجات مختارة", categoryId: "", limit: 8 },
    settings: defaultSectionSettings(),
  },
  {
    type: "BRAND_GRID",
    dataEn: { heading: "Brands we distribute", brandIds: [] },
    dataAr: { heading: "العلامات التجارية التي نوزّعها", brandIds: [] },
    settings: defaultSectionSettings(),
  },
  {
    type: "ICON_CARDS",
    dataEn: {
      heading: "What working with us actually looks like",
      items: [
        { icon: "snowflake", title: "Cold-chain discipline", body: "Frozen, chilled, and ambient product handled and stored to its required temperature class, every step from receiving to delivery.", link: "" },
        { icon: "boxes", title: "Full-catalog distribution", body: "One supplier across frozen, chilled, and ambient goods, instead of coordinating separate vendors for each category.", link: "" },
        { icon: "handshake", title: "Built for foodservice", body: "Order volumes and delivery schedules built around hotels, restaurants, catering, and hospitals — not retail shelves.", link: "" },
        { icon: "truck", title: "Jeddah-based, Saudi-wide", body: "Operating from Jeddah with distribution reach across the Kingdom.", link: "" },
      ],
    },
    dataAr: {
      heading: "كيف يبدو العمل معنا فعليًا",
      items: [
        { icon: "snowflake", title: "انضباط سلسلة التبريد", body: "تُدار المنتجات المجمدة والمبردة والعادية وتُخزَّن وفق درجة الحرارة المطلوبة، في كل خطوة من الاستلام حتى التسليم.", link: "" },
        { icon: "boxes", title: "توزيع بكامل الكتالوج", body: "مورّد واحد للمنتجات المجمدة والمبردة والعادية، بدلًا من التنسيق مع موردين منفصلين لكل فئة.", link: "" },
        { icon: "handshake", title: "مصمم لقطاع الأغذية", body: "أحجام الطلبات وجداول التسليم مبنية حول الفنادق والمطاعم وشركات التموين والمستشفيات، لا رفوف التجزئة.", link: "" },
        { icon: "truck", title: "مقرّنا جدة، وتغطيتنا المملكة", body: "نعمل من جدة مع تغطية توزيع تمتد عبر أنحاء المملكة.", link: "" },
      ],
    },
    settings: defaultSectionSettings({ desktop: { paddingY: "lg", marginY: "none", align: "left", columns: "4", headingSize: "lg", bodySize: "md", visible: true } }),
  },
  {
    type: "ICON_CARDS",
    dataEn: {
      heading: "Built around your operation, not a generic order form",
      items: [
        { icon: "star", title: "Hotels", body: "Consistent supply across every food & beverage outlet under one roof.", link: "/solutions/hotels" },
        { icon: "thermometer", title: "Restaurants", body: "Menu-driven ordering with the temperature discipline your kitchen needs.", link: "/solutions/restaurants" },
        { icon: "truck", title: "Catering", body: "Volume and scheduling built around event-driven demand.", link: "/solutions/catering" },
        { icon: "shield", title: "Hospitals", body: "Reliable, compliant supply for institutional food service.", link: "/solutions/hospitals" },
        { icon: "boxes", title: "Wholesale", body: "Bulk supply for onward distribution.", link: "/solutions/wholesale" },
        { icon: "package", title: "Retail", body: "Retail-ready packaging and delivery cadence.", link: "/solutions/retail" },
        { icon: "clock", title: "Food Service", body: "Operators who need a dependable, full-catalog supplier.", link: "/solutions/food-service" },
      ],
    },
    dataAr: {
      heading: "مبني حول طبيعة عملك، لا نموذج طلب عام",
      items: [
        { icon: "star", title: "الفنادق", body: "إمداد ثابت لكل منافذ الأغذية والمشروبات تحت سقف واحد.", link: "/solutions/hotels" },
        { icon: "thermometer", title: "المطاعم", body: "طلبات مبنية على القائمة مع الانضباط الحراري الذي يحتاجه مطبخك.", link: "/solutions/restaurants" },
        { icon: "truck", title: "شركات التموين", body: "أحجام وجداول مبنية حول الطلب المرتبط بالفعاليات.", link: "/solutions/catering" },
        { icon: "shield", title: "المستشفيات", body: "إمداد موثوق ومتوافق مع المعايير لخدمة الأغذية المؤسسية.", link: "/solutions/hospitals" },
        { icon: "boxes", title: "تجارة الجملة", body: "إمداد بالجملة لإعادة التوزيع.", link: "/solutions/wholesale" },
        { icon: "package", title: "التجزئة", body: "تعبئة جاهزة للتجزئة ووتيرة تسليم مناسبة.", link: "/solutions/retail" },
        { icon: "clock", title: "قطاع الأغذية", body: "لمشغلي القطاع الذين يحتاجون موردًا موثوقًا بكامل الكتالوج.", link: "/solutions/food-service" },
      ],
    },
    settings: defaultSectionSettings({ desktop: { paddingY: "lg", marginY: "none", align: "left", columns: "4", headingSize: "lg", bodySize: "md", visible: true } }),
  },
  {
    type: "TIMELINE",
    dataEn: {
      heading: "From sourcing to your loading dock",
      items: [
        { date: "", title: "Sourcing", body: "Product is sourced internationally and locally against our specification." },
        { date: "", title: "Import", body: "Import and customs clearance handled end-to-end." },
        { date: "", title: "Quality Control", body: "Received and checked against temperature and quality requirements on arrival." },
        { date: "", title: "Storage", body: "Held in temperature-controlled storage, separated by frozen / chilled / ambient class." },
        { date: "", title: "Distribution", body: "Picked and loaded for delivery on a schedule built around your operation." },
        { date: "", title: "Customer", body: "Delivered to your loading dock, ready to use." },
      ],
    },
    dataAr: {
      heading: "من التوريد إلى رصيف التحميل لديك",
      items: [
        { date: "", title: "التوريد", body: "يتم توريد المنتج من مصادر محلية ودولية وفق مواصفاتنا." },
        { date: "", title: "الاستيراد", body: "تُدار عمليات الاستيراد والتخليص الجمركي من البداية إلى النهاية." },
        { date: "", title: "مراقبة الجودة", body: "يتم فحص المنتج عند الاستلام للتأكد من مطابقته لمتطلبات الحرارة والجودة." },
        { date: "", title: "التخزين", body: "يُحفظ المنتج في تخزين مُتحكَّم بدرجة الحرارة، مع فصل المجمد والمبرد والعادي." },
        { date: "", title: "التوزيع", body: "يتم تجهيز الطلبات وتحميلها للتسليم وفق جدول مبني حول عملياتك." },
        { date: "", title: "العميل", body: "يصل المنتج إلى رصيف التحميل لديك جاهزًا للاستخدام." },
      ],
    },
    settings: defaultSectionSettings(),
  },
  {
    type: "CTA",
    dataEn: {
      heading: "Handled to the standard the product requires",
      body: "Frozen, chilled, and ambient goods are kept separated by temperature class through storage and delivery, not just labeled as such on arrival.",
      ctaLabel: "Read our quality approach",
      ctaUrl: "/quality-food-safety",
    },
    dataAr: {
      heading: "يُدار وفق المعيار الذي يتطلبه المنتج",
      body: "تُحفظ المنتجات المجمدة والمبردة والعادية منفصلة حسب فئة درجة الحرارة أثناء التخزين والتسليم، لا مجرد توصيفها كذلك عند الوصول.",
      ctaLabel: "اقرأ عن نهجنا في الجودة",
      ctaUrl: "/quality-food-safety",
    },
    settings: defaultSectionSettings({ background: "ink", desktop: { paddingY: "lg", marginY: "none", align: "center", columns: "1", headingSize: "xl", bodySize: "md", visible: true } }),
  },
  {
    type: "NEWS_GRID",
    dataEn: { heading: "Latest from the blog", categoryId: "", limit: 3 },
    dataAr: { heading: "أحدث المقالات", categoryId: "", limit: 3 },
    settings: defaultSectionSettings(),
  },
  {
    type: "CTA",
    dataEn: {
      heading: "Tell us what your operation needs",
      body: "Send us your product categories and order volumes — a member of our team will follow up with what we can supply and when.",
      ctaLabel: "Request a quote",
      ctaUrl: "/contact",
    },
    dataAr: {
      heading: "أخبرنا بما تحتاجه عمليتك",
      body: "أرسل لنا فئات المنتجات وأحجام الطلبات — سيتواصل معك أحد أعضاء فريقنا بما يمكننا توفيره وموعده.",
      ctaLabel: "اطلب عرض سعر",
      ctaUrl: "/contact",
    },
    settings: defaultSectionSettings({ background: "ink", desktop: { paddingY: "lg", marginY: "none", align: "center", columns: "1", headingSize: "xl", bodySize: "md", visible: true } }),
  },
  {
    type: "CONTACT_FORM",
    dataEn: { heading: "Get in touch", body: "Tell us what your business needs — a member of our team will get back to you.", submitLabel: "Send message", showMessage: true, inquiryType: "GENERAL" },
    dataAr: { heading: "تواصل معنا", body: "أخبرنا بما تحتاجه شركتك، وسيتواصل معك أحد أعضاء فريقنا.", submitLabel: "إرسال الرسالة", showMessage: true, inquiryType: "GENERAL" },
    settings: defaultSectionSettings({ background: "frost" }),
  },
];

async function main() {
  const page = await prisma.page.upsert({
    where: { slug: HOMEPAGE_SLUG },
    update: {},
    create: { slug: HOMEPAGE_SLUG, status: "DRAFT" },
  });

  // Replace the section set on every run (rerunnable, matches seed-demo-content.ts's upsert spirit
  // for a small, fully-owned row set -- these sections are entirely managed by this script/the admin,
  // never hand-edited outside it before the first run).
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
      data: { pageId: page.id, isPublished: true, note: "Initial homepage seed", snapshot: { sections: snapshotSections } },
    });
    await tx.page.update({ where: { id: page.id }, data: { status: "PUBLISHED", publishedAt: new Date() } });
  });

  console.log(`Homepage seeded and published: ${sections.length} sections, page id ${page.id}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
