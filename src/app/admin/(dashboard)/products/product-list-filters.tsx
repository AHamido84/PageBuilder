"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

interface Props {
  categories: { id: string; label: string }[];
  brands: { id: string; slug: string }[];
}

const selectClass = "rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm text-neutral-100";

export function ProductListFilters({ categories, brands }: Props) {
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
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
      <input
        type="search"
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(e) => update("q", e.target.value)}
        placeholder="Search by name or SKU..."
        className={`${selectClass} sm:col-span-2`}
      />
      <select defaultValue={searchParams.get("category") ?? ""} onChange={(e) => update("category", e.target.value)} className={selectClass}>
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
      <select defaultValue={searchParams.get("brand") ?? ""} onChange={(e) => update("brand", e.target.value)} className={selectClass}>
        <option value="">All brands</option>
        {brands.map((b) => (
          <option key={b.id} value={b.id}>
            {b.slug}
          </option>
        ))}
      </select>
      <select defaultValue={searchParams.get("status") ?? ""} onChange={(e) => update("status", e.target.value)} className={selectClass}>
        <option value="">All statuses</option>
        <option value="published">Published</option>
        <option value="draft">Draft</option>
      </select>
    </div>
  );
}
