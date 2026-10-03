import {
  Archivo,
  Public_Sans,
  Inter,
  Poppins,
  Manrope,
  DM_Sans,
  Plus_Jakarta_Sans,
  IBM_Plex_Mono,
  IBM_Plex_Sans_Arabic,
  Cairo,
  Tajawal,
  Noto_Kufi_Arabic,
  Noto_Sans_Arabic,
} from "next/font/google";

/**
 * Every typeface the Appearance page can select. Fonts are self-hosted by next/font at build time
 * (no runtime requests to Google, nothing fetched from an admin-supplied URL) -- the admin picks
 * from this curated list by key (see ENGLISH_FONTS/ARABIC_FONTS in design-tokens/schema.ts).
 *
 * Each font exposes its own CSS variable (--font-body-<key> for English, --font-arabic-<key> for
 * Arabic, --font-display-archivo for the default heading face); globals.css points the variables
 * the site actually consumes (--font-body, --font-arabic, --font-display, --font-display-ar) at
 * the defaults, and resolve-css.ts re-points them at whatever the admin chose.
 *
 * Only the defaults are preloaded. The browser downloads a non-default font's files only once an
 * admin has actually selected it (an @font-face nothing uses is never fetched).
 */
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-display-archivo", display: "swap" });
const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-body-public-sans", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body-inter", display: "swap", preload: false });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body-poppins", display: "swap", preload: false });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-body-manrope", display: "swap", preload: false });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-body-dm-sans", display: "swap", preload: false });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-body-plus-jakarta-sans", display: "swap", preload: false });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono", display: "swap" });
const plexArabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600", "700"], variable: "--font-arabic-plex-arabic", display: "swap" });
const cairo = Cairo({ subsets: ["arabic"], variable: "--font-arabic-cairo", display: "swap", preload: false });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"], variable: "--font-arabic-tajawal", display: "swap", preload: false });
const notoKufi = Noto_Kufi_Arabic({ subsets: ["arabic"], variable: "--font-arabic-noto-kufi-arabic", display: "swap", preload: false });
const notoSansArabic = Noto_Sans_Arabic({ subsets: ["arabic"], variable: "--font-arabic-noto-sans-arabic", display: "swap", preload: false });

/** Put on <html> so every font variable above is defined site-wide. */
export const fontVariableClassNames = [
  archivo,
  publicSans,
  inter,
  poppins,
  manrope,
  dmSans,
  plusJakarta,
  plexMono,
  plexArabic,
  cairo,
  tajawal,
  notoKufi,
  notoSansArabic,
]
  .map((font) => font.variable)
  .join(" ");
