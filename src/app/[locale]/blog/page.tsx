import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/admin/ui/pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 9;

interface BlogPageProps {
  searchParams: Promise<{ category?: string; page?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations("blog");
  const page = Math.max(1, Number(params.page) || 1);

  const where: Prisma.BlogPostWhereInput = { status: "PUBLISHED" };
  if (params.category) where.category = { slug: params.category };

  const [posts, total, categories] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { coverImage: { select: { url: true } }, category: true },
    }),
    prisma.blogPost.count({ where }),
    prisma.blogCategory.findMany({ orderBy: { nameEn: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function hrefForPage(p: number) {
    const sp = new URLSearchParams();
    if (params.category) sp.set("category", params.category);
    sp.set("page", String(p));
    return `?${sp.toString()}`;
  }

  return (
    <Section tone="paper" eyebrow={t("eyebrow")} title={t("title")}>
      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href={`/${locale}/blog`}
          className={`rounded-full border px-3 py-1.5 text-sm ${!params.category ? "border-ink bg-ink text-paper" : "border-ink/15 text-ink/60 hover:border-ink/40"}`}
        >
          {t("allCategories")}
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/${locale}/blog?category=${c.slug}`}
            className={`rounded-full border px-3 py-1.5 text-sm ${params.category === c.slug ? "border-ink bg-ink text-paper" : "border-ink/15 text-ink/60 hover:border-ink/40"}`}
          >
            {locale === "ar" ? c.nameAr : c.nameEn}
          </Link>
        ))}
      </div>

      {posts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.id} href={`/${locale}/blog/${post.slug}`} className="group block">
                <Card className="overflow-hidden p-0">
                  <div className="aspect-[4/3] w-full overflow-hidden bg-frost">
                    {post.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.coverImage.url} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                    ) : null}
                  </div>
                  <div className="p-4">
                    {post.category ? <p className="manifest-strip mb-2 text-ink/40">{locale === "ar" ? post.category.nameAr : post.category.nameEn}</p> : null}
                    <p className="mb-2 font-display text-lg leading-snug">{locale === "ar" ? post.titleAr : post.titleEn}</p>
                    {(locale === "ar" ? post.excerptAr : post.excerptEn) ? (
                      <p className="line-clamp-2 text-sm text-ink/60">{locale === "ar" ? post.excerptAr : post.excerptEn}</p>
                    ) : null}
                    {post.publishedAt ? (
                      <p className="font-mono-data mt-3 text-xs text-ink/35">{post.publishedAt.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")}</p>
                    ) : null}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} hrefForPage={hrefForPage} variant="light" />
        </>
      ) : (
        <EmptyState title={t("empty")} />
      )}
    </Section>
  );
}
