import Link from "next/link";
import * as LucideIcons from "lucide-react";
import { Tag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { StyledText } from "@/components/text/styled-text";
import { richOf } from "@/lib/text-style/rich-text";
import type { BlockRenderProps } from "../../types";
import type { SolutionsGridData } from "../commerce-blocks";

/** `Solution.icon` stores a lucide-react component name (e.g. "BedDouble") -- same convention as
 * Category.icon and the exact same resolver the public /solutions index page already uses (see
 * src/app/[locale]/solutions/page.tsx), duplicated here rather than imported since that file is a
 * page module (not something block code should import from) and this is a tiny, stable helper. */
function resolveIcon(name: string | null): LucideIcons.LucideIcon {
  if (!name) return Tag;
  const icon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[name];
  return icon ?? Tag;
}

interface SolutionCard {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  icon: string | null;
}

async function loadSolutions(locale: string, limit: number | undefined): Promise<SolutionCard[]> {
  const localeCode = locale.toUpperCase();
  const rows = await prisma.solution.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
    include: { translations: true },
    take: limit,
  });
  return rows.map((s) => {
    const translation = s.translations.find((t) => t.locale === localeCode);
    return { id: s.id, slug: s.slug, name: translation?.name ?? s.slug, shortDescription: translation?.shortDescription ?? null, icon: s.icon };
  });
}

/** Genuine gap filled for the "Solutions" section type: no Page Builder block previously let an
 * admin drop the real Solutions catalog (src/app/[locale]/solutions/page.tsx's own data source)
 * onto an arbitrary page (e.g. the homepage) -- this reuses that exact query/card pattern instead
 * of inventing a second one. */
export async function SolutionsGridRender({ data, locale }: BlockRenderProps<SolutionsGridData>) {
  const solutions = await loadSolutions(locale, data.limit);
  if (solutions.length === 0) return null;

  return (
    <div>
      {data.heading ? <h2 className="mb-8 font-display text-h2"><StyledText text={data.heading} rich={richOf(data, "heading")} /></h2> : null}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {solutions.map((solution) => {
          const Icon = resolveIcon(solution.icon);
          return (
            <Link key={solution.id} href={`/${locale}/solutions/${solution.slug}`}>
              <Card variant="solution" className="h-full p-8">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-harbor-soft">
                  <Icon size={24} strokeWidth={1.75} className="text-harbor" aria-hidden="true" />
                </span>
                <p className="mt-5 font-display text-h4">{solution.name}</p>
                {solution.shortDescription ? <p className="mt-2 text-sm leading-relaxed text-ink/60">{solution.shortDescription}</p> : null}
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
