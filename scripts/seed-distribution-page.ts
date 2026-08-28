/**
 * Converts /distribution-logistics from a hardcoded React route into a real Page Builder page
 * (slug "distribution-logistics", unchanged URL) -- same pattern as seed-about-page.ts /
 * seed-contact-page.ts. Every string is copied verbatim from messages/en.json / ar.json's
 * `distribution` and `home` namespaces -- nothing invented.
 *
 * The 6-step cold-chain flow uses the TIMELINE block's "journey" layout -- explicitly built for
 * "the signature scroll-driven cold-chain-style presentation (a drawn route line, checkpoints that
 * activate as they enter view)" (see timelineSchema in commerce/../social-proof-blocks.ts), a closer
 * match to the old page's bespoke ColdChainJourney component than the plain "list" layout.
 *
 * Run: npx tsx scripts/seed-distribution-page.ts
 */
import { prisma } from "../src/lib/prisma";
import { defaultSectionSettings } from "../src/lib/page-builder/types";

const DISTRIBUTION_SLUG = "distribution-logistics";

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
      eyebrow: "Distribution & logistics",
      headline: "From sourcing to your loading dock",
      subheading: "Distribution is the core of what we do — moving frozen, chilled, and ambient product from source to storage to your business, on a schedule that fits how you order.",
      ctaVisible: false,
      mediaType: "image",
    },
    dataAr: {
      eyebrow: "التوزيع والخدمات اللوجستية",
      headline: "من التوريد إلى رصيف التحميل لديك",
      subheading: "التوزيع هو جوهر عملنا — نقل المنتجات المجمدة والمبردة والعادية من المصدر إلى التخزين ثم إلى عملك، وفق جدول يناسب طريقة طلبك.",
      ctaVisible: false,
      mediaType: "image",
    },
    settings: defaultSectionSettings({ background: "paper", desktop: { paddingY: "xl", marginY: "none", align: "center", columns: "1", headingSize: "2xl", bodySize: "md", visible: true } }),
  },
  {
    type: "TIMELINE",
    dataEn: {
      heading: "Six steps, one continuous cold chain",
      layout: "journey",
      items: [
        { title: "Sourcing", body: "Product is sourced both internationally and locally, against the category and temperature-class requirements of our catalog." },
        { title: "Import", body: "Import and customs clearance handled end-to-end, so product moves from origin to our storage without unplanned delay." },
        { title: "Quality control", body: "Received and checked against temperature and quality requirements on arrival, before it enters storage." },
        { title: "Temperature-controlled storage", body: "Held in storage separated by temperature class — frozen, chilled, and ambient — until it's scheduled for delivery." },
        { title: "Distribution", body: "Picked and loaded for delivery on a schedule built around your operation, not a fixed weekly slot." },
        { title: "Customer", body: "Delivered to hotels, restaurants, catering companies, hospitals, and wholesale markets across the Kingdom — to your loading dock, ready to use." },
      ],
    },
    dataAr: {
      heading: "ست خطوات، وسلسلة تبريد واحدة متصلة",
      layout: "journey",
      items: [
        { title: "التوريد", body: "يتم توريد المنتج محليًا ودوليًا، وفق متطلبات الفئة وفئة درجة الحرارة في كتالوجنا." },
        { title: "الاستيراد", body: "تُدار إجراءات الاستيراد والتخليص الجمركي بالكامل، لضمان انتقال المنتج من المصدر إلى مخازننا دون تأخير غير مخطط له." },
        { title: "مراقبة الجودة", body: "يُستلم المنتج ويُفحص وفق متطلبات درجة الحرارة والجودة عند الوصول، قبل دخوله إلى التخزين." },
        { title: "تخزين مُتحكَّم بدرجة الحرارة", body: "يُحفظ في تخزين منفصل حسب فئة درجة الحرارة — مجمد ومبرد وعادي — حتى موعد جدولته للتسليم." },
        { title: "التوزيع", body: "يُجهَّز المنتج ويُحمَّل للتسليم وفق جدول مبني حول عملياتك، وليس موعدًا أسبوعيًا ثابتًا." },
        { title: "العميل", body: "يُسلَّم إلى الفنادق والمطاعم وشركات التموين والمستشفيات وأسواق الجملة في جميع أنحاء المملكة — حتى رصيف التحميل لديك، جاهزًا للاستخدام." },
      ],
    },
    settings: defaultSectionSettings({ background: "frost" }),
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
    where: { slug: DISTRIBUTION_SLUG },
    update: {},
    create: { slug: DISTRIBUTION_SLUG, status: "DRAFT" },
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
      data: { pageId: page.id, isPublished: true, note: "Initial distribution page seed", snapshot: { sections: snapshotSections } },
    });
    await tx.page.update({ where: { id: page.id }, data: { status: "PUBLISHED", publishedAt: new Date() } });
  });

  console.log(`Distribution page seeded and published: ${sections.length} sections, page id ${page.id}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
