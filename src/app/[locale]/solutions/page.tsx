import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import * as LucideIcons from "lucide-react";
import { Tag } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "solutionsIndex" });
  return buildMetadata({ locale, path: "/solutions", fallbackTitle: t("title"), fallbackDescription: t("body") });
}

/** `Solution.icon` stores a lucide-react component name (e.g. "BedDouble"), same convention
 * as Category.icon -- falls back to a generic tag icon if unset or unrecognized. */
function resolveIcon(name: string | null): LucideIcons.LucideIcon {
  if (!name) return Tag;
  const icon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[name];
  return icon ?? Tag;
}

export default async function SolutionsIndexPage() {
  const locale = await getLocale();
  const t = await getTranslations("solutionsIndex");

  const solutions = await prisma.solution.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
    include: { translations: true },
  });

  return (
    <Section tone="paper" eyebrow={t("eyebrow")} title={t("title")} description={t("body")}>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {solutions.map((solution) => {
          const translation = solution.translations.find((tr) => tr.locale === locale.toUpperCase());
          const Icon = resolveIcon(solution.icon);
          return (
            <Link key={solution.id} href={`/${locale}/solutions/${solution.slug}`}>
              <Card className="h-full p-6">
                <Icon size={22} strokeWidth={1.75} className="mb-3 text-harbor" aria-hidden="true" />
                <p className="font-display text-xl">{translation?.name ?? solution.slug}</p>
                {translation?.shortDescription ? (
                  <p className="mt-2 text-sm leading-relaxed text-ink/60">{translation.shortDescription}</p>
                ) : null}
              </Card>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}
