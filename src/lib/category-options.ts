export interface CategoryOptionSource {
  id: string;
  slug: string;
  parentId: string | null;
  translations: { locale: "EN" | "AR"; name: string }[];
}

export interface CategoryOption {
  id: string;
  label: string;
}

/** Flattens a category tree into a depth-indented option list for a <select>, parents before children. */
export function buildCategoryOptions(categories: CategoryOptionSource[], locale: "EN" | "AR" = "EN"): CategoryOption[] {
  const byParent = new Map<string | null, CategoryOptionSource[]>();
  for (const c of categories) {
    const list = byParent.get(c.parentId) ?? [];
    list.push(c);
    byParent.set(c.parentId, list);
  }

  const options: CategoryOption[] = [];
  function walk(parentId: string | null, depth: number) {
    for (const c of byParent.get(parentId) ?? []) {
      const name = c.translations.find((t) => t.locale === locale)?.name ?? c.slug;
      options.push({ id: c.id, label: `${"— ".repeat(depth)}${name}` });
      walk(c.id, depth + 1);
    }
  }
  walk(null, 0);
  return options;
}
