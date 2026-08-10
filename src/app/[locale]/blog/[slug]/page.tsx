import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/ui/section";
import { BackArrow } from "@/components/ui/arrow";
import { buildMetadata, SITE_URL } from "@/lib/seo/metadata";
import { articleSchema, breadcrumbSchema } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/site/json-ld";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: { seo: { include: { ogImage: { select: { url: true } } } }, coverImage: { select: { url: true } } },
  });
  if (!post || post.status !== "PUBLISHED") return {};
  const title = locale === "ar" ? post.titleAr : post.titleEn;
  const excerpt = locale === "ar" ? post.excerptAr : post.excerptEn;
  return buildMetadata({
    locale,
    path: `/blog/${slug}`,
    seo: post.seo ?? { titleEn: null, titleAr: null, descriptionEn: null, descriptionAr: null, canonicalUrl: null, noIndex: false, ogImage: post.coverImage },
    fallbackTitle: title,
    fallbackDescription: excerpt,
    ogType: "article",
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("blog");

  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: { coverImage: { select: { url: true } }, category: true, tags: true, author: { select: { name: true } } },
  });

  if (!post || post.status !== "PUBLISHED") notFound();

  const title = locale === "ar" ? post.titleAr : post.titleEn;
  const content = locale === "ar" ? post.contentAr : post.contentEn;
  const excerpt = locale === "ar" ? post.excerptAr : post.excerptEn;

  const structuredData = [
    articleSchema({
      headline: title,
      description: excerpt,
      imageUrl: post.coverImage?.url,
      authorName: post.author?.name,
      publishedAt: (post.publishedAt ?? post.createdAt).toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      url: `${SITE_URL}/${locale}/blog/${slug}`,
    }),
    breadcrumbSchema([
      { name: "Home", url: `${SITE_URL}/${locale}` },
      { name: t("title"), url: `${SITE_URL}/${locale}/blog` },
      { name: title, url: `${SITE_URL}/${locale}/blog/${slug}` },
    ]),
  ];

  return (
    <Section tone="paper" className="border-t-0 pb-16 pt-10 sm:pt-14">
      <JsonLd data={structuredData} />
      <div className="mx-auto max-w-3xl">
        <Link href={`/${locale}/blog`} className="text-sm text-ink/50 hover:text-harbor">
          <BackArrow /> {t("backToBlog")}
        </Link>

        <div className="mt-6">
          {post.category ? <p className="manifest-strip mb-3 text-harbor">{locale === "ar" ? post.category.nameAr : post.category.nameEn}</p> : null}
          <h1 className="font-display text-3xl leading-[1.1] sm:text-4xl">{title}</h1>
          <p className="font-mono-data mt-3 text-xs text-ink/40">
            {post.publishedAt ? post.publishedAt.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US") : null}
            {post.author?.name ? ` · ${post.author.name}` : ""}
          </p>
        </div>

        {post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImage.url} alt="" className="mt-8 aspect-[16/9] w-full rounded-[var(--radius-md)] object-cover" />
        ) : null}

        <div className="mt-8 whitespace-pre-line text-base leading-relaxed text-ink/75">{content}</div>

        {post.tags.length > 0 ? (
          <div className="mt-10 flex flex-wrap gap-2 border-t border-ink/10 pt-6">
            {post.tags.map((tag) => (
              <span key={tag.id} className="rounded-full border border-ink/15 px-3 py-1 text-xs text-ink/60">
                {locale === "ar" ? tag.nameAr : tag.nameEn}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Section>
  );
}
