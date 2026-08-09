import type { BlockType } from "./block-types";

export function buildSectionData(type: BlockType, formData: FormData): { dataEn: Record<string, unknown>; dataAr: Record<string, unknown> } {
  const f = (name: string) => (formData.get(name) as string | null) ?? "";

  switch (type) {
    case "HERO": {
      const shared = { ctaUrl: f("ctaUrl"), imageId: f("imageId") };
      return {
        dataEn: { ...shared, headline: f("headlineEn"), subheading: f("subheadingEn"), ctaLabel: f("ctaLabelEn") },
        dataAr: { ...shared, headline: f("headlineAr"), subheading: f("subheadingAr"), ctaLabel: f("ctaLabelAr") },
      };
    }
    case "TEXT": {
      return {
        dataEn: { body: f("bodyEn") },
        dataAr: { body: f("bodyAr") },
      };
    }
    case "MEDIA_TEXT": {
      const shared = { imageId: f("imageId"), imagePosition: f("imagePosition") || "left" };
      return {
        dataEn: { ...shared, heading: f("headingEn"), body: f("bodyEn") },
        dataAr: { ...shared, heading: f("headingAr"), body: f("bodyAr") },
      };
    }
    case "GALLERY": {
      const images = [1, 2, 3, 4, 5, 6].map((n) => f(`galleryImage${n}`)).filter(Boolean);
      return {
        dataEn: { heading: f("headingEn"), images },
        dataAr: { heading: f("headingAr"), images },
      };
    }
    case "PRODUCT_GRID": {
      const shared = { categoryId: f("categoryId"), limit: f("limit") || "8" };
      return {
        dataEn: { ...shared, heading: f("headingEn") },
        dataAr: { ...shared, heading: f("headingAr") },
      };
    }
    case "CONTACT_CTA": {
      return {
        dataEn: { heading: f("headingEn"), body: f("bodyEn"), ctaLabel: f("ctaLabelEn") },
        dataAr: { heading: f("headingAr"), body: f("bodyAr"), ctaLabel: f("ctaLabelAr") },
      };
    }
    case "VALUE_PROPS": {
      const items = [1, 2, 3, 4].map((n) => ({
        titleEn: f(`vpTitle${n}En`),
        titleAr: f(`vpTitle${n}Ar`),
        bodyEn: f(`vpBody${n}En`),
        bodyAr: f(`vpBody${n}Ar`),
      })).filter((item) => item.titleEn || item.titleAr);
      return {
        dataEn: { heading: f("headingEn"), items: items.map((i) => ({ title: i.titleEn, body: i.bodyEn })) },
        dataAr: { heading: f("headingAr"), items: items.map((i) => ({ title: i.titleAr, body: i.bodyAr })) },
      };
    }
    default:
      return { dataEn: {}, dataAr: {} };
  }
}
