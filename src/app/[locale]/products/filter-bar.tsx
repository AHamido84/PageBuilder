"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { Search } from "lucide-react";

interface FilterBarProps {
  categories: { slug: string; name: string }[];
  brands: { slug: string; name: string }[];
}

const TEMPERATURE_VALUES = ["FROZEN", "CHILLED", "AMBIENT"] as const;

const selectClasses =
  "h-11 rounded-[var(--radius-sm)] border border-ink/15 bg-paper px-3 text-sm text-ink transition-colors hover:border-ink/30";

export function FilterBar({ categories, brands }: FilterBarProps) {
  const t = useTranslations("products");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-5">
      <div className="relative sm:col-span-2">
        <Search size={16} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-ink/35" aria-hidden="true" />
        <input
          type="search"
          defaultValue={searchParams.get("q") ?? ""}
          onChange={(e) => update("q", e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="h-11 w-full rounded-[var(--radius-sm)] border border-ink/15 bg-paper ps-10 pe-3 text-sm placeholder:text-ink/40 transition-colors hover:border-ink/30"
        />
      </div>
      <select
        defaultValue={searchParams.get("category") ?? ""}
        onChange={(e) => update("category", e.target.value)}
        aria-label={t("filterCategory")}
        className={selectClasses}
      >
        <option value="">{t("allCategories")}</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        defaultValue={searchParams.get("brand") ?? ""}
        onChange={(e) => update("brand", e.target.value)}
        aria-label={t("filterBrand")}
        className={selectClasses}
      >
        <option value="">{t("allBrands")}</option>
        {brands.map((b) => (
          <option key={b.slug} value={b.slug}>
            {b.name}
          </option>
        ))}
      </select>
      <select
        defaultValue={searchParams.get("temp") ?? ""}
        onChange={(e) => update("temp", e.target.value)}
        aria-label={t("filterTemperature")}
        className={selectClasses}
      >
        <option value="">{t("allTemperatures")}</option>
        {TEMPERATURE_VALUES.map((value) => (
          <option key={value} value={value}>
            {t(`temp${value.charAt(0)}${value.slice(1).toLowerCase()}`)}
          </option>
        ))}
      </select>
      <select
        defaultValue={searchParams.get("sort") ?? "newest"}
        onChange={(e) => update("sort", e.target.value)}
        aria-label={t("sortLabel")}
        className={`${selectClasses} sm:col-start-5`}
      >
        <option value="newest">{t("sortNewest")}</option>
        <option value="name-asc">{t("sortNameAsc")}</option>
        <option value="name-desc">{t("sortNameDesc")}</option>
      </select>
    </div>
  );
}
