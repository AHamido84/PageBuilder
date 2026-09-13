/**
 * Phase 6 "Solution Page" migration -- enforces the required visual order (IMAGE, TITLE,
 * DESCRIPTION, CONTENT, BENEFITS if existing, CTA) on every existing Solution's linked Page.
 *
 * seed-solutions.ts originally put the "Request a quote" button *inside* the HERO section
 * (ctaVisible: true) with no separate trailing CTA section -- reasonable at the time (it matched
 * the pre-migration hardcoded page), but it means CTA renders mid-page instead of last. This
 * script, for every Solution:
 *   1. Hides the HERO's own inline CTA (ctaVisible: false in both dataEn/dataAr) so IMAGE/TITLE/
 *      DESCRIPTION (all inside HERO) render with nothing after them but CONTENT/BENEFITS.
 *   2. Appends a real CTA section at the end, reusing the *exact same* ctaLabel/ctaUrl the hero
 *      already had -- no new copy invented, just relocated to the end of the page.
 *   3. Re-publishes (new PageRevision snapshot) so the change is live immediately, matching how
 *      seed-solutions.ts itself published.
 *
 * Idempotent: a page whose HERO already has ctaVisible: false and already ends in a CTA section is
 * left untouched (safe to re-run). Only touches Solution pages -- no other Page Builder pages.
 *
 * Run: npx tsx scripts/fix-solution-page-order.ts
 */
import { prisma } from "../src/lib/prisma";
import { defaultSectionSettings } from "../src/lib/page-builder/types";

async function main() {
  const solutions = await prisma.solution.findMany({
    include: { page: { include: { sections: { orderBy: { order: "asc" } } } } },
  });

  for (const solution of solutions) {
    const sections = solution.page.sections;
    const hero = sections.find((s) => s.type === "HERO");
    const lastSection = sections[sections.length - 1];
    const alreadyFixed = hero ? (hero.dataEn as { ctaVisible?: boolean })?.ctaVisible === false : true;
    const alreadyHasCta = lastSection?.type === "CTA";

    if (alreadyFixed && alreadyHasCta) {
      console.log(`Skipping "${solution.slug}" -- already fixed.`);
      continue;
    }

    const heroDataEn = hero?.dataEn as { ctaLabel?: string; ctaUrl?: string } | undefined;
    const heroDataAr = hero?.dataAr as { ctaLabel?: string; ctaUrl?: string } | undefined;
    const ctaLabelEn = heroDataEn?.ctaLabel || "Request a quote";
    const ctaUrlEn = heroDataEn?.ctaUrl || "/contact";
    const ctaLabelAr = heroDataAr?.ctaLabel || "اطلب عرض سعر";
    const ctaUrlAr = heroDataAr?.ctaUrl || "/contact";

    await prisma.$transaction(async (tx) => {
      if (hero && !alreadyFixed) {
        await tx.pageSection.update({
          where: { id: hero.id },
          data: {
            dataEn: { ...(hero.dataEn as object), ctaVisible: false },
            dataAr: { ...(hero.dataAr as object), ctaVisible: false },
          },
        });
      }
      if (!alreadyHasCta) {
        await tx.pageSection.create({
          data: {
            pageId: solution.pageId,
            type: "CTA",
            order: sections.length,
            dataEn: { heading: "", body: "", ctaLabel: ctaLabelEn, ctaUrl: ctaUrlEn, layout: "centered", image: null },
            dataAr: { heading: "", body: "", ctaLabel: ctaLabelAr, ctaUrl: ctaUrlAr, layout: "centered", image: null },
            settings: defaultSectionSettings({ background: "ink", desktop: { paddingY: "lg", marginY: "none", align: "center", columns: "1", headingSize: "xl", bodySize: "md", visible: true } }) as object,
            isVisible: true,
          },
        });
      }
    });

    const freshSections = await loadFreshSections(solution.pageId);
    await prisma.$transaction(async (tx) => {
      await tx.pageRevision.updateMany({ where: { pageId: solution.pageId, isPublished: true }, data: { isPublished: false } });
      await tx.pageRevision.create({
        data: { pageId: solution.pageId, isPublished: true, note: "Phase 6: enforce IMAGE/TITLE/DESCRIPTION/CONTENT/BENEFITS/CTA order", snapshot: { sections: freshSections } },
      });
      await tx.page.update({ where: { id: solution.pageId }, data: { status: "PUBLISHED", publishedAt: new Date() } });
    });

    console.log(`Fixed "${solution.slug}" -- CTA moved to end, republished.`);
  }
}

async function loadFreshSections(pageId: string) {
  const rows = await prisma.pageSection.findMany({ where: { pageId }, orderBy: { order: "asc" } });
  return rows.map((s) => ({ id: s.id, type: s.type, order: s.order, dataEn: s.dataEn, dataAr: s.dataAr, settings: s.settings, isVisible: s.isVisible }));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
