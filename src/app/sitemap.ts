import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/seo/metadata";
import { routing } from "@/i18n/routing";
import { isReservedPageSlug } from "@/lib/page-builder/reserved-slugs";

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
  const [products, brands, blogPosts, pages, solutions] = await Promise.all([
    prisma.product.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
    prisma.brand.findMany({ where: { isActive: true }, select: { slug: true } }),
    prisma.blogPost.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    // Reserved Pages (homepage, __solution__<slug>, __header__<key>) are filtered out below via
    // `isReservedPageSlug` -- none of them has an independently reachable /<slug> URL of its own
    // (the homepage's is covered by STATIC_PATHS's "/" entry, Solution's by the `solutions` query
    // below under its real /solutions/<slug> URL, and __header__ pages are an embedded fragment,
    // not a standalone page at all).
    prisma.page.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    }),
    prisma.solution.findMany({ where: { isPublished: true, page: { status: "PUBLISHED" } }, select: { slug: true, updatedAt: true } }),
  ]);

  const entries: MetadataRoute.Sitemap = STATIC_PATHS.flatMap((path) => entriesForPath(path));

  for (const product of products) entries.push(...entriesForPath(`/products/${product.slug}`, product.updatedAt));
  for (const brand of brands) entries.push(...entriesForPath(`/brands/${brand.slug}`));
  for (const post of blogPosts) entries.push(...entriesForPath(`/blog/${post.slug}`, post.updatedAt));
  for (const page of pages) if (!isReservedPageSlug(page.slug)) entries.push(...entriesForPath(`/${page.slug}`, page.updatedAt));
  for (const solution of solutions) entries.push(...entriesForPath(`/solutions/${solution.slug}`, solution.updatedAt));

  return entries;
}
