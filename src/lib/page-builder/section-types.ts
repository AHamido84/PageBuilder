/**
 * The homepage "section types" an editor thinks in, mapped onto the block registry. Most are a
 * block 1:1; a few are a block with a preset (e.g. "Slideshow" is the Hero block in slideshow
 * mode, "Logo Marquee" is the Marquee block showing logos). Presets are shallow-merged over the
 * block's own defaultData for BOTH locales, so the result is an ordinary section of that block --
 * no new storage shape, and every existing section keeps rendering exactly as before.
 *
 * Shown as the first group in the Page Builder's Add panel; also searchable by these names.
 */
export interface SectionTypePreset {
  key: string;
  label: string;
  /** Block registry type this creates. */
  type: string;
  /** Fields merged over the block's default data (both languages). */
  preset?: Record<string, unknown>;
  /** Extra words that should find this entry in the Add panel search. */
  keywords?: string;
}

export const SECTION_TYPES: SectionTypePreset[] = [
  { key: "hero", label: "Hero", type: "HERO", keywords: "banner header" },
  { key: "slideshow", label: "Slideshow", type: "HERO", preset: { mediaType: "slideshow" }, keywords: "slider fade" },
  { key: "carousel", label: "Carousel", type: "HERO", preset: { mediaType: "carousel", layout: "full-bleed" }, keywords: "carousel slider swipe" },
  { key: "banner", label: "Banner", type: "BANNER", keywords: "banner promo background image video" },
  { key: "image-text", label: "Image + Text", type: "IMAGE_TEXT", keywords: "split story" },
  { key: "feature-strip", label: "Feature Strip", type: "FEATURE_CARDS", keywords: "features benefits usp" },
  { key: "categories", label: "Categories", type: "CATEGORY_GRID", keywords: "category bento" },
  { key: "products", label: "Products", type: "PRODUCT_GRID", keywords: "product grid catalog" },
  { key: "brands", label: "Brands", type: "BRAND_GRID", keywords: "brand partners" },
  { key: "logo-marquee", label: "Logo Marquee", type: "MARQUEE", preset: { contentType: "logos" }, keywords: "logos ticker scrolling" },
  { key: "stats", label: "Stats", type: "STATISTICS", keywords: "numbers statistics counters" },
  { key: "process", label: "Process", type: "TIMELINE", keywords: "steps how it works timeline" },
  { key: "solutions", label: "Solutions", type: "SOLUTIONS_GRID", keywords: "segments industries business" },
  { key: "testimonials", label: "Testimonials", type: "TESTIMONIALS", keywords: "reviews quotes" },
  { key: "gallery", label: "Gallery", type: "GALLERY", keywords: "images photos" },
  { key: "video", label: "Video", type: "VIDEO", keywords: "film youtube" },
  { key: "cta", label: "CTA", type: "CTA", keywords: "call to action banner" },
  { key: "articles", label: "Articles", type: "NEWS_GRID", keywords: "blog news posts" },
  { key: "newsletter", label: "Newsletter", type: "NEWSLETTER", keywords: "subscribe email" },
  { key: "contact", label: "Contact", type: "CONTACT_FORM", keywords: "form enquiry quote" },
  { key: "custom", label: "Custom Content", type: "RICH_TEXT", keywords: "text html rich free" },
  // Homepage-structure names (Phase 4) -- same blocks, presets matching the homepage reference.
  { key: "introduction", label: "Introduction", type: "IMAGE_TEXT", keywords: "intro about company" },
  { key: "category-discovery", label: "Category Discovery", type: "CATEGORY_GRID", preset: { mode: "all", layout: "chips" }, keywords: "discover chips category links" },
  { key: "quote-cta", label: "Quote CTA", type: "CTA", preset: { ctaUrl: "/contact" }, keywords: "request quote call to action" },
  { key: "story", label: "Story / Value", type: "CTA", preset: { layout: "banner" }, keywords: "story value proposition banner image" },
  { key: "business-segments", label: "Business Segments", type: "ICON_CARDS", keywords: "segments restaurants hotels cafes industries cards" },
  { key: "quote-form", label: "Quote Form", type: "QUOTE_FORM", preset: { layout: "split", buttonStyle: "gold" }, keywords: "quote form request lead" },
];
