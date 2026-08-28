/**
 * One-time content migration for the dynamic Solutions system (Solution/SolutionTranslation,
 * migration 20260828003510_solutions_brand_certification). Companion to seed-homepage.ts /
 * seed-contact-page.ts -- same upsert-and-replace-sections, rerunnable pattern.
 *
 * Creates one Solution + linked Page per existing hardcoded segment (previously
 * src/lib/solutions-segments.ts), reproducing today's page output as real Page Builder sections
 * so /solutions/<slug> looks the same immediately after this runs, with zero content invented:
 * every string below is copied verbatim from messages/en.json / messages/ar.json's `solutions`,
 * `solutionsIndex`, and `home` (why1-4, ctaButton) namespaces -- the exact same source the old
 * hardcoded pages read from.
 *
 * ICON_CARDS only supports a fixed icon vocabulary (see ICON_OPTIONS in
 * src/lib/page-builder/blocks/social-proof/icon-cards.tsx), smaller than the raw lucide-react set
 * the old page used directly (Snowflake/Package/UtensilsCrossed/MapPin) -- "snowflake"/"package"
 * carry over exactly, "handshake"/"globe" are the closest available stand-ins for the other two.
 * Purely decorative, not a content change.
 *
 * The Hero's own CTA (ctaLabel/ctaUrl) carries the "Request a quote" -> /contact button that the
 * old page rendered inline in its hero -- no separate CTA section is added, since the original
 * page didn't have one either.
 *
 * Run: npx tsx scripts/seed-solutions.ts
 */
import { prisma } from "../src/lib/prisma";
import { defaultSectionSettings } from "../src/lib/page-builder/types";

interface SegmentSeed {
  slug: string;
  icon: string; // lucide-react component name, see Solution.icon
  en: { name: string; summary: string; body: string };
  ar: { name: string; summary: string; body: string };
}

const SEGMENTS: SegmentSeed[] = [
  {
    slug: "hotels",
    icon: "BedDouble",
    en: {
      name: "Hotels",
      summary: "Consistent supply across every food & beverage outlet under one roof.",
      body: "Hotels run multiple kitchens off one supply chain — restaurants, banquets, room service, and staff catering all need the same product to show up the same way, every time. We supply frozen, chilled, and ambient goods on delivery schedules built around your F&B calendar, not a fixed weekly slot.",
    },
    ar: {
      name: "الفنادق",
      summary: "إمداد ثابت لكل منافذ الأغذية والمشروبات تحت سقف واحد.",
      body: "تدير الفنادق عدة مطابخ من سلسلة توريد واحدة — المطاعم والولائم وخدمة الغرف وتموين الموظفين، جميعها تحتاج نفس المنتج بنفس الجودة في كل مرة. نوفر منتجات مجمدة ومبردة وعادية وفق جداول تسليم مبنية حول تقويم الأغذية والمشروبات لديكم، لا موعد أسبوعي ثابت.",
    },
  },
  {
    slug: "restaurants",
    icon: "UtensilsCrossed",
    en: {
      name: "Restaurants",
      summary: "Menu-consistent sourcing so your dishes taste the same every service.",
      body: "A menu is only as consistent as its supply. We distribute the proteins, ingredients, and packaged goods restaurants build their menus around, held at the right temperature class from our storage to your kitchen.",
    },
    ar: {
      name: "المطاعم",
      summary: "توريد ثابت يحافظ على طعم أطباقكم في كل مرة.",
      body: "القائمة لا تكون ثابتة إلا بقدر ثبات مصدر توريدها. نوزّع البروتينات والمكونات والمنتجات المعبأة التي تبني عليها المطاعم قوائمها، محفوظة عند فئة درجة الحرارة الصحيحة من مخازننا حتى مطبخكم.",
    },
  },
  {
    slug: "catering",
    icon: "ChefHat",
    en: {
      name: "Catering",
      summary: "Volume and timing built around event schedules, not standing orders.",
      body: "Catering orders swing with the event calendar — a wedding one week, a corporate conference the next. We supply the volumes catering companies need against the delivery windows their events actually require.",
    },
    ar: {
      name: "شركات التموين",
      summary: "أحجام ومواعيد مبنية حول جدول الفعاليات، لا طلبات ثابتة.",
      body: "طلبات التموين تتغير مع تقويم الفعاليات — حفل زفاف أسبوعًا، ومؤتمر شركات في الأسبوع التالي. نوفر الأحجام التي تحتاجها شركات التموين وفق نوافذ التسليم التي تتطلبها فعالياتها فعليًا.",
    },
  },
  {
    slug: "hospitals",
    icon: "Stethoscope",
    en: {
      name: "Hospitals",
      summary: "Dependable supply for patient and staff catering operations.",
      body: "Hospital catering can't run short. We supply hospitals with a consistent, correctly temperature-classed product stream for both patient meal services and staff dining.",
    },
    ar: {
      name: "المستشفيات",
      summary: "إمداد موثوق لعمليات تموين المرضى والموظفين.",
      body: "تموين المستشفيات لا يحتمل النقص. نوفر للمستشفيات تدفقًا ثابتًا من المنتجات المصنّفة بدرجة الحرارة الصحيحة لخدمات وجبات المرضى وتموين الموظفين على حد سواء.",
    },
  },
  {
    slug: "wholesale",
    icon: "Warehouse",
    en: {
      name: "Wholesale",
      summary: "Full-catalog supply for onward distribution and resale.",
      body: "We supply wholesale buyers across our frozen, chilled, and ambient catalog for onward distribution, with the documentation and SKU consistency resale operations need.",
    },
    ar: {
      name: "تجارة الجملة",
      summary: "توريد بكامل الكتالوج لإعادة التوزيع والبيع.",
      body: "نوفر لمشتري الجملة عبر كامل كتالوجنا من المنتجات المجمدة والمبردة والعادية لإعادة التوزيع، مع المستندات وثبات رموز الأصناف التي تحتاجها عمليات إعادة البيع.",
    },
  },
  {
    slug: "retail",
    icon: "Store",
    en: {
      name: "Retail",
      summary: "Shelf-stable and cold-chain goods for retail food outlets.",
      body: "Retail food outlets need product that survives the trip from our storage to their shelves in the same condition it left in. We supply both ambient and cold-chain goods with that in mind.",
    },
    ar: {
      name: "التجزئة",
      summary: "منتجات مبردة وعادية لمنافذ بيع الأغذية بالتجزئة.",
      body: "تحتاج منافذ بيع الأغذية بالتجزئة منتجات تصل من مخازننا إلى رفوفها بنفس الحالة التي غادرت بها. نوفر المنتجات العادية ومنتجات سلسلة التبريد مع مراعاة ذلك.",
    },
  },
  {
    slug: "food-service",
    icon: "Utensils",
    en: {
      name: "Food Service",
      summary: "Broader foodservice operators sourcing across multiple categories.",
      body: "For foodservice operators that don't fit neatly into one category — canteens, staff dining contractors, institutional kitchens — we supply across our full catalog from a single account.",
    },
    ar: {
      name: "قطاع الأغذية",
      summary: "مشغلو قطاع الأغذية الذين يوردون عبر فئات متعددة.",
      body: "لمشغلي قطاع الأغذية الذين لا يندرجون تحت فئة واحدة — كالمقاصف ومقاولي تموين الموظفين والمطابخ المؤسسية — نوفر عبر كامل كتالوجنا من حساب واحد.",
    },
  },
];

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

const CTA_LABEL_EN = "Request a quote";
const CTA_LABEL_AR = "اطلب عرض سعر";

interface SectionSeed {
  type: string;
  dataEn: unknown;
  dataAr: unknown;
  settings: ReturnType<typeof defaultSectionSettings>;
}

function sectionsFor(segment: SegmentSeed): SectionSeed[] {
  return [
    {
      type: "HERO",
      dataEn: {
        headline: segment.en.name,
        subheading: segment.en.summary,
        ctaLabel: CTA_LABEL_EN,
        ctaUrl: "/contact",
        ctaVisible: true,
        mediaType: "image",
      },
      dataAr: {
        headline: segment.ar.name,
        subheading: segment.ar.summary,
        ctaLabel: CTA_LABEL_AR,
        ctaUrl: "/contact",
        ctaVisible: true,
        mediaType: "image",
      },
      settings: defaultSectionSettings({ background: "ink", desktop: { paddingY: "xl", marginY: "none", align: "center", columns: "1", headingSize: "2xl", bodySize: "md", visible: true } }),
    },
    {
      type: "RICH_TEXT",
      dataEn: { html: `<p>${segment.en.body}</p>` },
      dataAr: { html: `<p>${segment.ar.body}</p>` },
      settings: defaultSectionSettings({ background: "paper" }),
    },
    {
      type: "ICON_CARDS",
      dataEn: { heading: "", items: WHY_ITEMS_EN },
      dataAr: { heading: "", items: WHY_ITEMS_AR },
      settings: defaultSectionSettings({ background: "frost", desktop: { paddingY: "lg", marginY: "none", align: "left", columns: "4", headingSize: "lg", bodySize: "md", visible: true } }),
    },
  ];
}

async function main() {
  for (const [index, segment] of SEGMENTS.entries()) {
    const pageSlug = `__solution__${segment.slug}`;
    const sections = sectionsFor(segment);

    const { page } = await prisma.$transaction(async (tx) => {
      const page = await tx.page.upsert({
        where: { slug: pageSlug },
        update: {},
        create: { slug: pageSlug, status: "DRAFT" },
      });

      const solution = await tx.solution.upsert({
        where: { slug: segment.slug },
        update: { icon: segment.icon, sortOrder: index, isPublished: true },
        create: { slug: segment.slug, icon: segment.icon, sortOrder: index, isPublished: true, pageId: page.id },
      });

      await tx.solutionTranslation.upsert({
        where: { solutionId_locale: { solutionId: solution.id, locale: "EN" } },
        create: { solutionId: solution.id, locale: "EN", name: segment.en.name, shortDescription: segment.en.summary },
        update: { name: segment.en.name, shortDescription: segment.en.summary },
      });
      await tx.solutionTranslation.upsert({
        where: { solutionId_locale: { solutionId: solution.id, locale: "AR" } },
        create: { solutionId: solution.id, locale: "AR", name: segment.ar.name, shortDescription: segment.ar.summary },
        update: { name: segment.ar.name, shortDescription: segment.ar.summary },
      });

      return { page, solution };
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
        data: { pageId: page.id, isPublished: true, note: "Initial solution seed", snapshot: { sections: snapshotSections } },
      });
      await tx.page.update({ where: { id: page.id }, data: { status: "PUBLISHED", publishedAt: new Date() } });
    });

    console.log(`Seeded solution "${segment.slug}" (${sections.length} sections), published.`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
