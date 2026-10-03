import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { CmsFillImage } from "@/components/media/cms-image";
import { Arrow } from "@/components/ui/arrow";
import type { BlockRenderProps } from "../../types";
import type { NewsGridData } from "../commerce-blocks";

const READ_MORE_LABEL = { en: "Read article", ar: "اقرأ المقال" };

function formatDate(date: Date | null, locale: string): string | null {
  if (!date) return null;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", { year: "numeric", month: "long", day: "numeric" }).format(date);
}

/** Phase 3 premium redesign: the first post gets an editorial full-width treatment (large image,
 * bigger type, explicit CTA) -- same "avoid repetitive grid-only layouts" pattern already
 * established by CategoryGridRender's FeaturedCategoryCard -- the rest stay in a plain grid. */
export async function NewsGridRender({ data, locale }: BlockRenderProps<NewsGridData>) {
  const limit = Number(data.limit) || 3;
  const posts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED", ...(data.categoryId ? { categoryId: data.categoryId } : {}) },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: { coverImage: { select: { url: true } }, category: true },
  });
  if (posts.length === 0) return null;

  const [featured, ...rest] = posts;
  const lang = locale === "ar" ? "ar" : "en";

  return (
    <div>
      {data.heading ? <h2 className="mb-8 font-display text-h2">{data.heading}</h2> : null}

      <Link
        href={`/${locale}/blog/${featured.slug}`}
        className="group relative mb-8 flex flex-col overflow-hidden rounded-[var(--card-radius-lg)] border border-current/10 sm:flex-row"
      >
        <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-frost sm:aspect-auto sm:w-1/2">
          {featured.coverImage ? (
            <CmsFillImage
              src={featured.coverImage.url}
              alt=""
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              context={{ component: "NEWS_GRID", locale }}
            />
          ) : null}
        </div>
        <div className="flex flex-1 flex-col justify-center gap-3 bg-paper p-8 sm:p-10 lg:p-12">
          {featured.category ? <p className="manifest-strip text-wheat-strong">{lang === "ar" ? featured.category.nameAr : featured.category.nameEn}</p> : null}
          <p className="font-display text-h3 leading-tight">{lang === "ar" ? featured.titleAr : featured.titleEn}</p>
          {(lang === "ar" ? featured.excerptAr : featured.excerptEn) ? (
            <p className="max-w-md text-sm leading-relaxed text-ink/60">{lang === "ar" ? featured.excerptAr : featured.excerptEn}</p>
          ) : null}
          <div className="mt-2 flex items-center gap-3 text-sm text-ink/50">
            {formatDate(featured.publishedAt, locale) ? <span className="font-mono-data text-xs uppercase tracking-wide">{formatDate(featured.publishedAt, locale)}</span> : null}
          </div>
          <span className="mt-1 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-harbor transition-transform duration-300 group-hover:translate-x-1">
            {READ_MORE_LABEL[lang]} <Arrow />
          </span>
        </div>
      </Link>

      {rest.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <Link key={post.id} href={`/${locale}/blog/${post.slug}`} className="group block">
              <Card variant="article" className="h-full overflow-hidden p-0">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-frost">
                  {post.coverImage ? (
                    <CmsFillImage
                      src={post.coverImage.url}
                      alt=""
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      context={{ component: "NEWS_GRID", locale }}
                    />
                  ) : null}
                </div>
                <div className="p-5">
                  {post.category ? <p className="manifest-strip mb-2 text-ink/40">{lang === "ar" ? post.category.nameAr : post.category.nameEn}</p> : null}
                  <p className="mb-2 font-display text-lg leading-snug">{lang === "ar" ? post.titleAr : post.titleEn}</p>
                  {(lang === "ar" ? post.excerptAr : post.excerptEn) ? (
                    <p className="line-clamp-2 text-sm text-ink/60">{lang === "ar" ? post.excerptAr : post.excerptEn}</p>
                  ) : null}
                  {formatDate(post.publishedAt, locale) ? (
                    <p className="mt-3 font-mono-data text-xs uppercase tracking-wide text-ink/40">{formatDate(post.publishedAt, locale)}</p>
                  ) : null}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
