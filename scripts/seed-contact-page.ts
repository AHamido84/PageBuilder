/**
 * Creates (or updates) /contact as a real Page Builder page instead of a
 * hardcoded route -- companion to seed-homepage.ts. Upserts a Page with
 * slug "contact" (a normal, unique slug -- no reserved-slug trick needed,
 * since the dedicated src/app/[locale]/contact/page.tsx route always wins
 * over the [...slug] catch-all for this exact path). Rerunnable: replaces
 * the section set on every run rather than duplicating.
 *
 * All copy below is pulled from the already-reviewed contactPage/contactForm
 * i18n namespaces -- nothing invented. The CONTACT_FORM section has
 * showTypeSelector on, matching the standalone form's previous behavior;
 * the new CONTACT_INFO section pulls location/email/phone/hours/map live
 * from SiteSetting, same as before -- just now composable in the builder.
 *
 * Run: npx tsx scripts/seed-contact-page.ts
 */
import { prisma } from "../src/lib/prisma";
import { defaultSectionSettings } from "../src/lib/page-builder/types";

const CONTACT_SLUG = "contact";

interface SectionSeed {
  type: string;
  dataEn: unknown;
  dataAr: unknown;
  settings: ReturnType<typeof defaultSectionSettings>;
}

const sections: SectionSeed[] = [
  {
    type: "CONTACT_FORM",
    dataEn: {
      heading: "Request a quote",
      body: "Tell us what your business needs — a member of our team will get back to you.",
      submitLabel: "Send request",
      showMessage: true,
      inquiryType: "GENERAL",
      showTypeSelector: true,
    },
    dataAr: {
      heading: "اطلب عرض سعر",
      body: "أخبرنا بما تحتاجه شركتك، وسيتواصل معك أحد أعضاء فريقنا.",
      submitLabel: "إرسال الطلب",
      showMessage: true,
      inquiryType: "GENERAL",
      showTypeSelector: true,
    },
    settings: defaultSectionSettings({ background: "paper", desktop: { paddingY: "xl", marginY: "none", align: "center", columns: "1", headingSize: "xl", bodySize: "md", visible: true } }),
  },
  {
    type: "CONTACT_INFO",
    dataEn: { heading: "Contact details" },
    dataAr: { heading: "بيانات التواصل" },
    settings: defaultSectionSettings({ background: "frost" }),
  },
];

async function main() {
  const page = await prisma.page.upsert({
    where: { slug: CONTACT_SLUG },
    update: {},
    create: { slug: CONTACT_SLUG, status: "DRAFT" },
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
      data: { pageId: page.id, isPublished: true, note: "Initial contact page seed", snapshot: { sections: snapshotSections } },
    });
    await tx.page.update({ where: { id: page.id }, data: { status: "PUBLISHED", publishedAt: new Date() } });
  });

  console.log(`Contact page seeded and published: ${sections.length} sections, page id ${page.id}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
