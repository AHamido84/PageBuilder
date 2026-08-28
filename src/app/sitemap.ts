import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/seo/metadata";
import { routing } from "@/i18n/routing";
import { HOMEPAGE_SLUG } from "@/lib/page-builder/homepage";

/** Reserved prefix for Pages that back another entity (e.g. Solution) rather than being
 * independently reachable -- see solutions/actions.ts's solutionPageSlug(). Excluded below so
 * they never leak into the sitemap as their own URL (their real URL is /solutions/<slug>). */
const RESERVED_PAGE_SLUG_PREFIX = "__solution__";

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
    // Excludes the reserved homepage Page row (already covered by STATIC_PATHS's "/" entry) and
    // any entity-backing Page (e.g. __solution__<slug>, covered by the `solutions` query below
    // under its own real URL) -- neither has an independently reachable /<slug> URL.
    prisma.page.findMany({
      where: { status: "PUBLISHED", NOT: [{ slug: HOMEPAGE_SLUG }, { slug: { startsWith: RESERVED_PAGE_SLUG_PREFIX } }] },
      select: { slug: true, updatedAt: true },
    }),
    prisma.solution.findMany({ where: { isPublished: true, page: { status: "PUBLISHED" } }, select: { slug: true, updatedAt: true } }),
  ]);

  const entries: MetadataRoute.Sitemap = STATIC_PATHS.flatMap((path) => entriesForPath(path));

  for (const product of products) entries.push(...entriesForPath(`/products/${product.slug}`, product.updatedAt));
  for (const brand of brands) entries.push(...entriesForPath(`/brands/${brand.slug}`));
  for (const post of blogPosts) entries.push(...entriesForPath(`/blog/${post.slug}`, post.updatedAt));
  for (const page of pages) entries.push(...entriesForPath(`/${page.slug}`, page.updatedAt));
  for (const solution of solutions) entries.push(...entriesForPath(`/solutions/${solution.slug}`, solution.updatedAt));

  return entries;
}
