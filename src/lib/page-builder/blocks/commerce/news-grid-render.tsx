import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import type { BlockRenderProps } from "../../types";
import type { NewsGridData } from "../commerce-blocks";

export async function NewsGridRender({ data, locale }: BlockRenderProps<NewsGridData>) {
  const limit = Number(data.limit) || 3;
  const posts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED", ...(data.categoryId ? { categoryId: data.categoryId } : {}) },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: { coverImage: { select: { url: true } }, category: true },
  });

  return (
    <div>
      {data.heading ? <h2 className="mb-6 font-display text-3xl">{data.heading}</h2> : null}
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
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
