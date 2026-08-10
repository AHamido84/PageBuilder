import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/seo/metadata";
import { SOLUTIONS_SEGMENTS } from "@/lib/solutions-segments";
import { routing } from "@/i18n/routing";

// Avoid prerendering this at build time -- it needs a live DB connection, and every other
// DB-backed route in this app is already force-dynamic for the same reason (see HANDOFF.md
// on Neon's occasional cold-start P1001 errors during idle periods).
export const dynamic = "force-dynamic";

const STATIC_PATHS = [
  "/",
  "/about",
  "/products",
  "/brands",
  "/blog",
  "/faq",
  "/contact",
  "/solutions",
  "/quality-food-safety",
  "/distribution-logistics",
  "/privacy",
  "/terms",
  "/cookies",
  ...SOLUTIONS_SEGMENTS.map((s) => `/solutions/${s.slug}`),
];

function entriesForPath(path: string, lastModified?: Date): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(routing.locales.map((locale) => [locale, `${SITE_URL}/${locale}${path === "/" ? "" : path}`]));
  return routing.locales.map((locale) => ({
    url: languages[locale],
    lastModified,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, brands, blogPosts, pages] = await Promise.all([
    prisma.product.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
    prisma.brand.findMany({ where: { isActive: true }, select: { slug: true } }),
    prisma.blogPost.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    prisma.page.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
  ]);

  const entries: MetadataRoute.Sitemap = STATIC_PATHS.flatMap((path) => entriesForPath(path));

  for (const product of products) entries.push(...entriesForPath(`/products/${product.slug}`, product.updatedAt));
  for (const brand of brands) entries.push(...entriesForPath(`/brands/${brand.slug}`));
  for (const post of blogPosts) entries.push(...entriesForPath(`/blog/${post.slug}`, post.updatedAt));
  for (const page of pages) entries.push(...entriesForPath(`/${page.slug}`, page.updatedAt));

  return entries;
}
