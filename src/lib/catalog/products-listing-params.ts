/**
 * Products listing URL state (pure, client-safe): the /products filters, sorting and paging as they
 * appear in the URL (`?q=&category=&brand=&temp=&sort=&page=` plus variant option filters such as
 * `?size=7mm`), shared by the classic products page and the Page Builder «Products Catalog» block.
 */

/** Filters the products filter bar can show (Products Catalog block: which ones, in what order). */
export const FILTER_KEYS = ["search", "category", "brand", "temperature", "sort", "options"] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

export type ListingSearchParams = Record<string, string | string[] | undefined>;
export type ListingSort = "newest" | "name-asc" | "name-desc";
export const TEMPERATURES = ["FROZEN", "CHILLED", "AMBIENT"] as const;
export type Temperature = (typeof TEMPERATURES)[number];

export interface ListingParams {
  q: string | null;
  category: string | null;
  /** True when the category came from the URL (not a block's default category). */
  categoryFromUrl: boolean;
  brand: string | null;
  temp: Temperature | null;
  sort: ListingSort;
  /** 1-based page number (pagination mode). */
  page: number;
  /** Items shown in load-more mode (a multiple of the page size). */
  show: number;
}

const first = (v: string | string[] | undefined): string | null => {
  const s = Array.isArray(v) ? v[0] : v;
  return typeof s === "string" && s.trim() !== "" ? s.trim() : null;
};

export function parseListingParams(params: ListingSearchParams, opts: { pageSize: number; defaultCategory?: string | null; defaultSort?: ListingSort } = { pageSize: 12 }): ListingParams {
  const urlCategory = first(params.category);
  const temp = first(params.temp);
  const sort = first(params.sort);
  const page = Math.max(1, Math.floor(Number(first(params.page)) || 1));
  const show = Math.max(opts.pageSize, Math.floor(Number(first(params.show)) || opts.pageSize));
  return {
    q: first(params.q)?.slice(0, 100) ?? null,
    category: urlCategory ?? opts.defaultCategory ?? null,
    categoryFromUrl: Boolean(urlCategory),
    brand: first(params.brand),
    temp: temp && (TEMPERATURES as readonly string[]).includes(temp) ? (temp as Temperature) : null,
    sort: sort === "name-asc" || sort === "name-desc" ? sort : (opts.defaultSort ?? "newest"),
    page,
    // Rounded up to whole pages and capped, so a hand-edited URL can't ask for thousands of cards.
    show: Math.min(Math.ceil(show / opts.pageSize) * opts.pageSize, opts.pageSize * 20),
  };
}

/**
 * Query string for a listing URL: the current filters (incl. option filters) with `patch` applied.
 * A null/empty value removes the key. Returns "?a=b" (or "" when nothing is set).
 */
export function listingQuery(params: ListingParams, optionSelection: Record<string, string>, patch: Record<string, string | number | null> = {}): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.category && params.categoryFromUrl) sp.set("category", params.category);
  if (params.brand) sp.set("brand", params.brand);
  if (params.temp) sp.set("temp", params.temp);
  if (params.sort !== "newest") sp.set("sort", params.sort);
  for (const [key, value] of Object.entries(optionSelection)) sp.set(key, value);
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === "") sp.delete(key);
    else sp.set(key, String(value));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/** The classic page's pagination links: every active filter plus `page=n` (unchanged format). */
export function pageHref(params: ListingParams, optionSelection: Record<string, string>, page: number): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.category && params.categoryFromUrl) sp.set("category", params.category);
  if (params.brand) sp.set("brand", params.brand);
  if (params.temp) sp.set("temp", params.temp);
  if (params.sort !== "newest") sp.set("sort", params.sort);
  for (const [key, value] of Object.entries(optionSelection)) sp.set(key, value);
  sp.set("page", String(page));
  return `?${sp.toString()}`;
}
