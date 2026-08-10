import Link from "next/link";
import { cn } from "@/lib/cn";

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Builds the href for a given page number, e.g. (p) => `/admin/products?page=${p}` (include other current query params). */
  hrefForPage: (page: number) => string;
  /** "dark" (default) for the admin's neutral-800 chrome, "light" for the public brand palette. */
  variant?: "dark" | "light";
}

export function Pagination({ page, totalPages, hrefForPage, variant = "dark" }: PaginationProps) {
  if (totalPages <= 1) return null;

  const isDark = variant === "dark";
  const enabledClass = isDark
    ? "rounded-md border border-neutral-700 px-3 py-1.5 text-neutral-300 hover:bg-neutral-800"
    : "rounded-[var(--radius-sm)] border border-ink/15 px-3 py-1.5 text-ink/70 hover:bg-ink hover:text-paper";
  const disabledClass = isDark
    ? "rounded-md border border-neutral-800 px-3 py-1.5 text-neutral-600"
    : "rounded-[var(--radius-sm)] border border-ink/10 px-3 py-1.5 text-ink/25";
  const labelClass = isDark ? "text-neutral-500" : "text-ink/40";

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <nav className="mt-6 flex items-center justify-center gap-3 text-sm" aria-label="Pagination">
      {prevDisabled ? <span className={disabledClass}>Previous</span> : <Link href={hrefForPage(page - 1)} className={enabledClass}>Previous</Link>}
      <span className={cn("font-mono-data text-xs", labelClass)}>
        Page {page} of {totalPages}
      </span>
      {nextDisabled ? <span className={disabledClass}>Next</span> : <Link href={hrefForPage(page + 1)} className={enabledClass}>Next</Link>}
    </nav>
  );
}
