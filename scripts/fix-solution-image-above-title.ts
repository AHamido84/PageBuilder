/**
 * Phase 7 "SOLUTION PAGES: Image ABOVE title. Everything editable." -- the single HERO section
 * session K/Phase-6 gave each Solution page bundles image+title+description into one block whose
 * `split` layout is side-by-side on desktop (never stacked) and whose `full-bleed` layout overlays
 * the title ON TOP of the image (not above it) -- neither satisfies a clean "image, then title"
 * stack at every viewport width (see Phase 7 investigation notes in HANDOFF.md's Session S entry).
 *
 * Rather than retrofitting Hero's ~1200-line layout system with a third layout mode (large blast
 * radius, touches every other Hero usage sitewide), this replaces each Solution page's HERO section
 * with two separate, always-stacked sections:
 *   1. IMAGE (Phase 7's new Image Control fields: aspect ratio/fit/focal point/overlay/mobile
 *      override) -- no photo invented, admin adds one later exactly like every other "ready but
 *      empty" gap in this project (Certifications, Solution hero photos, ...).
 *   2. PAGE_INTRO (eyebrow/title/description) -- title/description copied VERBATIM from the HERO
 *      section being replaced, zero content lost or invented.
 *
 * RICH_TEXT (content), ICON_CARDS (benefits), and CTA (added by fix-solution-page-order.ts) are
 * left completely untouched, just renumbered to follow the new IMAGE+PAGE_INTRO pair.
 *
 * Idempotent (checks the page's first two sections before touching anything) -- safe to re-run.
 *
 * Run: npx tsx scripts/fix-solution-image-above-title.ts
 */
import { prisma } from "../src/lib/prisma";
import { defaultSectionSettings } from "../src/lib/page-builder/types";

async function main() {
  const solutions = await prisma.solution.findMany({
    include: { page: { include: { sections: { orderBy: { order: "asc" } } } } },
  });

  for (const solution of solutions) {
    const sections = solution.page.sections;
    const alreadyFixed = sections[0]?.type === "IMAGE" && sections[1]?.type === "PAGE_INTRO";
    if (alreadyFixed) {
      console.log(`Skipping "${solution.slug}" -- already fixed.`);
      continue;
    }

    const hero = sections.find((s) => s.type === "HERO");
    if (!hero) {
      console.log(`Skipping "${solution.slug}" -- no HERO section found.`);
      continue;
    }
    const heroDataEn = hero.dataEn as { headline?: string; subheading?: string };
    const heroDataAr = hero.dataAr as { headline?: string; subheading?: string };

    const rest = sections.filter((s) => s.id !== hero.id);

    await prisma.$transaction(async (tx) => {
      await tx.pageSection.delete({ where: { id: hero.id } });

      await tx.pageSection.create({
        data: {
          pageId: solution.pageId,
          type: "IMAGE",
          order: 0,
          dataEn: { image: null, mobileImage: null, altEn: "", altAr: "", linkUrl: "", aspectRatio: "16/9", imageFit: "cover", focalX: 50, focalY: 50, overlayOpacity: 0 },
          dataAr: { image: null, mobileImage: null, altEn: "", altAr: "", linkUrl: "", aspectRatio: "16/9", imageFit: "cover", focalX: 50, focalY: 50, overlayOpacity: 0 },
          // No section padding -- an image should read edge-to-edge (and an unset image leaves
          // zero blank space, rather than an empty padded band) above the title that follows.
          settings: defaultSectionSettings({ background: "paper", desktop: { paddingY: "none", marginY: "none", align: "left", columns: "1", headingSize: "2xl", bodySize: "md", visible: true } }) as object,
          isVisible: true,
        },
      });

      await tx.pageSection.create({
        data: {
          pageId: solution.pageId,
          type: "PAGE_INTRO",
          order: 1,
          dataEn: { eyebrow: "", title: heroDataEn.headline ?? "", description: heroDataEn.subheading ?? "" },
          dataAr: { eyebrow: "", title: heroDataAr.headline ?? "", description: heroDataAr.subheading ?? "" },
          settings: defaultSectionSettings({ background: "paper", desktop: { paddingY: "lg", marginY: "none", align: "left", columns: "1", headingSize: "2xl", bodySize: "md", visible: true } }) as object,
          isVisible: true,
        },
      });

      for (const [i, section] of rest.entries()) {
        await tx.pageSection.update({ where: { id: section.id }, data: { order: i + 2 } });
      }
    });

    const freshSections = await prisma.pageSection.findMany({ where: { pageId: solution.pageId }, orderBy: { order: "asc" } });
    const snapshotSections = freshSections.map((s) => ({ id: s.id, type: s.type, order: s.order, dataEn: s.dataEn, dataAr: s.dataAr, settings: s.settings, isVisible: s.isVisible }));

    await prisma.$transaction(async (tx) => {
      await tx.pageRevision.updateMany({ where: { pageId: solution.pageId, isPublished: true }, data: { isPublished: false } });
      await tx.pageRevision.create({
        data: { pageId: solution.pageId, isPublished: true, note: "Phase 7: IMAGE above TITLE (replaces HERO with IMAGE + PAGE_INTRO)", snapshot: { sections: snapshotSections } as object },
      });
    });

    console.log(`Fixed "${solution.slug}" -- HERO replaced with IMAGE + PAGE_INTRO, republished.`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
