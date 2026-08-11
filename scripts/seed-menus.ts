/**
 * Seeds the HEADER and FOOTER menus (managed at /admin/menus) with the same
 * structure the site previously had hardcoded in header.tsx/footer.tsx --
 * see HANDOFF.md gap #1. Rerunnable: replaces each menu's item set on every
 * run rather than duplicating (same pattern as seed-homepage.ts).
 *
 * All labels/URLs below are pulled from the already-reviewed nav/solutions
 * i18n namespaces (messages/en.json, messages/ar.json) -- nothing invented.
 *
 * Run: npx tsx scripts/seed-menus.ts
 */
import { prisma } from "../src/lib/prisma";

interface ItemSeed {
  labelEn: string;
  labelAr: string;
  url?: string;
  children?: ItemSeed[];
}

const SOLUTIONS_CHILDREN: ItemSeed[] = [
  { labelEn: "Hotels", labelAr: "الفنادق", url: "/solutions/hotels" },
  { labelEn: "Restaurants", labelAr: "المطاعم", url: "/solutions/restaurants" },
  { labelEn: "Catering", labelAr: "شركات التموين", url: "/solutions/catering" },
  { labelEn: "Hospitals", labelAr: "المستشفيات", url: "/solutions/hospitals" },
  { labelEn: "Wholesale", labelAr: "تجارة الجملة", url: "/solutions/wholesale" },
  { labelEn: "Retail", labelAr: "التجزئة", url: "/solutions/retail" },
  { labelEn: "Food Service", labelAr: "قطاع الأغذية", url: "/solutions/food-service" },
];

const COMPANY_CHILDREN_HEADER: ItemSeed[] = [
  { labelEn: "About", labelAr: "من نحن", url: "/about" },
  { labelEn: "Quality & Food Safety", labelAr: "الجودة وسلامة الغذاء", url: "/quality-food-safety" },
  { labelEn: "Distribution & Logistics", labelAr: "التوزيع والخدمات اللوجستية", url: "/distribution-logistics" },
  { labelEn: "Brands", labelAr: "العلامات التجارية", url: "/brands" },
];

const COMPANY_CHILDREN_FOOTER: ItemSeed[] = [
  ...COMPANY_CHILDREN_HEADER,
  { labelEn: "Blog", labelAr: "المدونة", url: "/blog" },
  { labelEn: "FAQ", labelAr: "الأسئلة الشائعة", url: "/faq" },
];

const HEADER_MENU: ItemSeed[] = [
  { labelEn: "Solutions", labelAr: "الحلول", children: SOLUTIONS_CHILDREN },
  { labelEn: "Company", labelAr: "الشركة", children: COMPANY_CHILDREN_HEADER },
];

const FOOTER_MENU: ItemSeed[] = [
  { labelEn: "Company", labelAr: "الشركة", children: COMPANY_CHILDREN_FOOTER },
  { labelEn: "Solutions", labelAr: "الحلول", children: SOLUTIONS_CHILDREN.slice(0, 5) },
];

async function seedMenu(location: "HEADER" | "FOOTER", items: ItemSeed[]) {
  const menu = await prisma.menu.upsert({ where: { location }, create: { location }, update: {} });
  await prisma.menuItem.deleteMany({ where: { menuId: menu.id } });

  for (let order = 0; order < items.length; order++) {
    const item = items[order];
    const parent = await prisma.menuItem.create({
      data: { menuId: menu.id, labelEn: item.labelEn, labelAr: item.labelAr, url: item.url ?? null, order },
    });
    for (let childOrder = 0; childOrder < (item.children?.length ?? 0); childOrder++) {
      const child = item.children![childOrder];
      await prisma.menuItem.create({
        data: { menuId: menu.id, labelEn: child.labelEn, labelAr: child.labelAr, url: child.url ?? null, order: childOrder, parentId: parent.id },
      });
    }
  }

  console.log(`${location} menu seeded: ${items.length} top-level items.`);
}

async function main() {
  await seedMenu("HEADER", HEADER_MENU);
  await seedMenu("FOOTER", FOOTER_MENU);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
