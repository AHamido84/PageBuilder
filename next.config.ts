import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { LEGACY_PRODUCT_SLUGS } from "./src/lib/seo/legacy-slugs";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isDev = process.env.NODE_ENV !== "production";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  // SAMEORIGIN (not DENY) so the admin Appearance page can show the live site in a preview iframe;
  // framing by any other origin is still refused (see also frame-ancestors below).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://www.facebook.com",
      "media-src 'self' https://*.public.blob.vercel-storage.com",
      `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://connect.facebook.net",
      "frame-src 'self' https://www.googletagmanager.com https://www.google.com",
      "frame-ancestors 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
    // AVIF first for browsers that accept it (~20% smaller than WebP), WebP otherwise. Generated on demand
    // by next/image from the single original in Blob storage -- no extra copies are stored at upload time.
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Variant products: the two Absher products merged into one (scripts/migrate-variants.ts). A real
  // 301 here -- the in-page Redirect-table fallback can only redirect after the page starts streaming.
  // Run the migration script BEFORE deploying this (the target must exist); a --revert also needs
  // this code rolled back.
  async redirects() {
    return [
      // Typo'd product slugs (src/lib/seo/legacy-slugs.ts) -> the corrected ones, both locales.
      ...Object.entries(LEGACY_PRODUCT_SLUGS).map(([from, to]) => ({
        source: `/:locale(ar|en)/products/${from}`,
        destination: `/:locale/products/${to}`,
        statusCode: 301 as const,
      })),
      { source: "/:locale(ar|en)/products/absher-frensh-fries-7mm", destination: "/:locale/products/absher-french-fries?size=7mm", statusCode: 301 },
      { source: "/:locale(ar|en)/products/absher-frensh-fries-10mm", destination: "/:locale/products/absher-french-fries?size=10mm", statusCode: 301 },
    ];
  },
};

export default withNextIntl(nextConfig);
