"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

interface FilterBarProps {
  categories: { slug: string; name: string }[];
}

const TEMPERATURE_VALUES = ["FROZEN", "CHILLED", "AMBIENT"] as const;

export function FilterBar({ categories }: FilterBarProps) {
  const t = useTranslations("products");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-4">
      <input
        type="search"
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(e) => update("q", e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="rounded-[var(--radius-sm)] border border-ink/15 bg-paper px-3 py-2.5 text-sm placeholder:text-ink/35 sm:col-span-2"
      />
      <select
        defaultValue={searchParams.get("category") ?? ""}
        onChange={(e) => update("category", e.target.value)}
        className="rounded-[var(--radius-sm)] border border-ink/15 bg-paper px-3 py-2.5 text-sm"
      >
        <option value="">{t("allCategories")}</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        defaultValue={searchParams.get("temp") ?? ""}
        onChange={(e) => update("temp", e.target.value)}
        className="rounded-[var(--radius-sm)] border border-ink/15 bg-paper px-3 py-2.5 text-sm"
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
        className="rounded-[var(--radius-sm)] border border-ink/15 bg-paper px-3 py-2.5 text-sm sm:col-start-4"
      >
        <option value="newest">{t("sortNewest")}</option>
        <option value="name-asc">{t("sortNameAsc")}</option>
        <option value="name-desc">{t("sortNameDesc")}</option>
      </select>
    </div>
  );
}
