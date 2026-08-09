import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { buttonClasses } from "@/components/ui/button";
import { ProductCard, type ProductCardData } from "@/components/site/product-card";

interface SectionRow {
  id: string;
  type: string;
  dataEn: unknown;
  dataAr: unknown;
  isVisible: boolean;
}

function d(data: unknown): Record<string, unknown> {
  return (data as Record<string, unknown>) ?? {};
}

async function getMediaUrl(mediaId: string | undefined): Promise<string | null> {
  if (!mediaId) return null;
  const media = await prisma.media.findUnique({ where: { id: mediaId }, select: { url: true } });
  return media?.url ?? null;
}

async function HeroBlock({ data }: { data: Record<string, unknown> }) {
  const imageUrl = await getMediaUrl(data.imageId as string);
  return (
    <Section tone="ink" className="border-t-0 text-center">
      <Container className="mx-auto max-w-2xl text-center">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="mb-6 h-48 w-full rounded-[var(--radius-md)] object-cover" />
        ) : null}
        <h1 className="font-display text-4xl sm:text-5xl">{String(data.headline ?? "")}</h1>
        {data.subheading ? <p className="mt-4 text-paper/70">{String(data.subheading)}</p> : null}
        {data.ctaLabel && data.ctaUrl ? (
          <Link href={String(data.ctaUrl)} className={`${buttonClasses("primary", "lg")} mt-8 inline-flex`}>
            {String(data.ctaLabel)}
          </Link>
        ) : null}
      </Container>
    </Section>
  );
}

function TextBlock({ data }: { data: Record<string, unknown> }) {
  return (
    <Section tone="paper">
      <p className="mx-auto max-w-2xl whitespace-pre-line text-base leading-relaxed text-ink/70">{String(data.body ?? "")}</p>
    </Section>
  );
}

async function MediaTextBlock({ data }: { data: Record<string, unknown> }) {
  const imageUrl = await getMediaUrl(data.imageId as string);
  const imageFirst = data.imagePosition !== "right";
  return (
    <Section tone="frost">
      <div className={`grid items-center gap-10 sm:grid-cols-2 ${imageFirst ? "" : "sm:[direction:rtl]"}`}>
        <div className={imageFirst ? "" : "sm:[direction:ltr]"}>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="aspect-[4/3] w-full rounded-[var(--radius-md)] object-cover" />
          ) : null}
        </div>
        <div className="sm:[direction:ltr]">
          {data.heading ? <h2 className="font-display text-2xl">{String(data.heading)}</h2> : null}
          {data.body ? <p className="mt-3 whitespace-pre-line text-ink/70">{String(data.body)}</p> : null}
        </div>
      </div>
    </Section>
  );
}

async function GalleryBlock({ data }: { data: Record<string, unknown> }) {
  const ids = (data.images as string[] | undefined) ?? [];
  const media = ids.length ? await prisma.media.findMany({ where: { id: { in: ids } }, select: { id: true, url: true } }) : [];
  const byId = new Map(media.map((m) => [m.id, m.url]));

  return (
    <Section tone="paper" title={data.heading ? String(data.heading) : undefined}>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {ids.map((id) =>
          byId.get(id) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={id} src={byId.get(id)} alt="" className="aspect-square w-full rounded-[var(--radius-md)] object-cover" />
          ) : null
        )}
      </div>
    </Section>
  );
}

async function ProductGridBlock({ data, locale }: { data: Record<string, unknown>; locale: string }) {
  const categoryId = data.categoryId as string | undefined;
  const limit = Number(data.limit) || 8;
  const products = await prisma.product.findMany({
    where: { isPublished: true, ...(categoryId ? { categoryId } : {}) },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { translations: true, category: { include: { translations: true } }, images: { take: 1, select: { url: true } } },
  });

  const cards: ProductCardData[] = products.map((product) => ({
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    temperatureClass: product.temperatureClass,
    name: product.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? product.sku,
    categoryName: product.category.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? product.category.slug,
    imageUrl: product.images[0]?.url ?? null,
  }));

  return (
    <Section tone="frost" title={data.heading ? String(data.heading) : undefined}>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        {cards.map((card) => (
          <ProductCard key={card.id} product={card} locale={locale} />
        ))}
      </div>
    </Section>
  );
}

function ContactCtaBlock({ data, locale }: { data: Record<string, unknown>; locale: string }) {
  return (
    <Section tone="ink" className="text-center">
      <Container className="mx-auto max-w-xl text-center">
        {data.heading ? <h2 className="font-display text-3xl">{String(data.heading)}</h2> : null}
        {data.body ? <p className="mx-auto mt-4 text-paper/65">{String(data.body)}</p> : null}
        <Link href={`/${locale}/contact`} className={`${buttonClasses("primary", "lg")} mt-8 inline-flex`}>
          {data.ctaLabel ? String(data.ctaLabel) : "Contact us"}
        </Link>
      </Container>
    </Section>
  );
}

function ValuePropsBlock({ data }: { data: Record<string, unknown> }) {
  const items = (data.items as { title: string; body: string }[] | undefined) ?? [];
  return (
    <Section tone="paper" title={data.heading ? String(data.heading) : undefined}>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, i) => (
          <div key={i}>
            <p className="font-display text-xl">{item.title}</p>
            <p className="mt-2 text-sm text-ink/65">{item.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export async function SectionRenderer({ sections, locale }: { sections: SectionRow[]; locale: string }) {
  const visible = sections.filter((s) => s.isVisible);

  return (
    <>
      {await Promise.all(
        visible.map(async (section) => {
          const data = d(locale === "ar" ? section.dataAr : section.dataEn);
          switch (section.type) {
            case "HERO":
              return <HeroBlock key={section.id} data={data} />;
            case "TEXT":
              return <TextBlock key={section.id} data={data} />;
            case "MEDIA_TEXT":
              return <MediaTextBlock key={section.id} data={data} />;
            case "GALLERY":
              return <GalleryBlock key={section.id} data={data} />;
            case "PRODUCT_GRID":
              return <ProductGridBlock key={section.id} data={data} locale={locale} />;
            case "CONTACT_CTA":
              return <ContactCtaBlock key={section.id} data={data} locale={locale} />;
            case "VALUE_PROPS":
              return <ValuePropsBlock key={section.id} data={data} />;
            default:
              return null;
          }
        })
      )}
    </>
  );
}
