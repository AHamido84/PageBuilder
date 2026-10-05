"use client";

import { Fragment, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Minus, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { fitChips } from "@/lib/chip-fit";
import {
  clearGroup,
  filterCatalog,
  keyLabel,
  parseKey,
  selectGroup,
  toggleKey,
  variantKey,
  type QuoteCatalogGroup,
  type QuoteCatalogItem,
} from "@/lib/quote/products-field";

/**
 * <MultiSelectDropdown> -- accessible multi-check dropdown for picking catalog products.
 *
 * Closed: a trigger styled like the form's other inputs; picks show as removable chips (full text; a
 * single chip wider than the field shortens with the full name in its tooltip),
 * collapsing to «first +n» so it never grows past two lines; «مسح الكل» clears.
 * Open: Arabic-normalized search, products grouped by category (sticky headers), optional
 * thumbnails, variant products as expandable rows (the row itself = «أي مقاس»), select/clear all
 * per group. Desktop: a ~320px panel under (or above) the trigger. Below 768px: a bottom sheet
 * with a sticky «تم (n)» button.
 * ARIA combobox + multiselectable listbox; ↑↓ move, Enter (or Space with an empty search) toggles,
 * Esc closes, typing on the trigger starts a search. Each pick submits a hidden `name` input.
 */

export interface MultiSelectLabels {
  placeholder: React.ReactNode;
  searchPlaceholder: string;
  clearAll: string;
  selectAll: string;
  deselectAll: string;
  done: string;
  noResults: string;
  anyVariant: string;
  remove: (label: string) => string;
  more: (n: number) => string;
  expand: (label: string) => string;
  maxReached: (n: number) => string;
}

export const MULTI_SELECT_LABELS: Record<"ar" | "en", Omit<MultiSelectLabels, "placeholder" | "searchPlaceholder">> = {
  ar: {
    clearAll: "مسح الكل",
    selectAll: "تحديد الكل",
    deselectAll: "إلغاء التحديد",
    done: "تم",
    noResults: "لا توجد منتجات مطابقة",
    anyVariant: "أي مقاس",
    remove: (l) => `إزالة ${l}`,
    more: (n) => `+${n.toLocaleString("ar-EG")}`,
    expand: (l) => `عرض أنواع ${l}`,
    maxReached: (n) => `الحد الأقصى ${n.toLocaleString("ar-EG")} منتجات`,
  },
  en: {
    clearAll: "Clear all",
    selectAll: "Select all",
    deselectAll: "Deselect all",
    done: "Done",
    noResults: "No matching products",
    anyVariant: "Any size",
    remove: (l) => `Remove ${l}`,
    more: (n) => `+${n}`,
    expand: (l) => `Show ${l} variants`,
    maxReached: (n) => `Up to ${n} products`,
  },
};

export interface MultiSelectDropdownProps {
  id: string;
  /** Hidden input name, one input per picked key. */
  name: string;
  groups: QuoteCatalogGroup[];
  value: string[];
  onChange: (next: string[]) => void;
  labels: MultiSelectLabels;
  dir: "rtl" | "ltr";
  showThumbnails?: boolean;
  showGroupHeaders?: boolean;
  maxSelections?: number;
  invalid?: boolean;
  /** Ids of the visible label and the error message. */
  labelledBy?: string;
  describedBy?: string;
  /** Matches the trigger to the surrounding inputs (height, border, radius, font). */
  triggerClassName?: string;
  disabled?: boolean;
}

type Row =
  | { kind: "item"; key: string; item: QuoteCatalogItem; hasVariants: boolean; expanded: boolean; groupId: string }
  | { kind: "variant"; key: string; item: QuoteCatalogItem; label: string; groupId: string };

export function MultiSelectDropdown({
  id,
  name,
  groups,
  value,
  onChange,
  labels,
  dir,
  showThumbnails = true,
  showGroupHeaders = true,
  maxSelections = 0,
  invalid,
  labelledBy,
  describedBy,
  triggerClassName,
  disabled,
}: MultiSelectDropdownProps) {
  const uid = useId();
  const listId = `${id}-listbox`;
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [placement, setPlacement] = useState<"down" | "up">("down");
  const [sheet, setSheet] = useState(false);

  const catalog = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const filtered = useMemo(() => filterCatalog(groups, query), [groups, query]);
  const selected = useMemo(() => new Set(value), [value]);

  const rows = useMemo(() => {
    const out: Row[] = [];
    for (const { group, items } of filtered) {
      for (const { item, variants, autoExpand } of items) {
        const hasVariants = item.variants.length > 0;
        const isOpen = hasVariants && (autoExpand || expanded.has(item.slug));
        out.push({ kind: "item", key: item.slug, item, hasVariants, expanded: isOpen, groupId: group.id });
        if (isOpen) for (const v of variants) out.push({ kind: "variant", key: variantKey(item.slug, v.id), item, label: v.label, groupId: group.id });
      }
    }
    return out;
  }, [filtered, expanded]);

  const optionId = (key: string) => `${uid}-opt-${key.replace(/[^a-zA-Z0-9-]/g, "_")}`;
  const atMax = maxSelections > 0 && value.length >= maxSelections;

  const close = useCallback((focusTrigger = true) => {
    setOpen(false);
    setQuery("");
    if (focusTrigger) triggerRef.current?.focus();
  }, []);

  function openPanel(seed = "") {
    if (disabled) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    setSheet(mobile);
    if (rect && !mobile) {
      const below = window.innerHeight - rect.bottom;
      setPlacement(below < 380 && rect.top > below ? "up" : "down");
    }
    setQuery(seed);
    setActive(0);
    setOpen(true);
  }

  // Focus the search box when the panel opens.
  useEffect(() => {
    if (open) searchRef.current?.focus({ preventScroll: true });
  }, [open]);

  // Outside click closes (desktop panel; the sheet has its own backdrop). The selection is kept.
  useEffect(() => {
    if (!open || sheet) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open, sheet, close]);

  // Esc closes from anywhere while open (e.g. after tapping the trigger again).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // The bottom sheet locks page scroll while it is open.
  useEffect(() => {
    if (!open || !sheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, sheet]);

  // Keep the active option in view.
  useEffect(() => {
    if (!open) return;
    const row = rows[active];
    if (row) document.getElementById(optionId(row.key))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- optionId is derived from the stable uid
  }, [active, open, rows]);

  const toggle = (key: string) => onChange(toggleKey(value, key, maxSelections));

  function toggleExpanded(slug: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function onSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    const row = rows[active];
    const expandKey = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
    const collapseKey = dir === "rtl" ? "ArrowRight" : "ArrowLeft";
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(rows.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Home" && !query) {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End" && !query) {
      e.preventDefault();
      setActive(rows.length - 1);
    } else if (e.key === "Enter" || (e.key === " " && !query)) {
      e.preventDefault(); // never submits the form
      if (row) toggle(row.key);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (row?.kind === "item" && row.hasVariants && (e.key === expandKey || e.key === collapseKey) && !query) {
      e.preventDefault();
      if ((e.key === expandKey) !== row.expanded) toggleExpanded(row.item.slug);
    }
  }

  function onTriggerKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return; // a chip's remove button
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      openPanel();
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      openPanel(e.key); // type to search
    }
  }

  const panel = open ? (
    <div
      className={cn(
        "z-50 flex flex-col overflow-hidden border border-[var(--g7-teal-900)]/20 bg-[var(--g7-white,#fff)] text-[var(--g7-teal-900)] shadow-[0_18px_40px_-12px_rgba(15,65,76,0.35)]",
        sheet ? "fixed inset-x-0 bottom-0 h-[80vh] rounded-t-[16px]" : cn("absolute start-0 w-[max(100%,20rem)] max-w-[calc(100vw-2rem)] rounded-[10px]", placement === "down" ? "top-full mt-1.5" : "bottom-full mb-1.5")
      )}
      role="dialog"
      aria-modal={sheet || undefined}
      aria-labelledby={labelledBy}
    >
      {sheet ? <div aria-hidden className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-[var(--g7-teal-900)]/20" /> : null}
      <div className="shrink-0 border-b border-[var(--g7-teal-900)]/10 p-2">
        <div className="relative">
          <Search size={16} aria-hidden className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[var(--g7-muted,#6b7a7e)]" />
          <input
            ref={searchRef}
            type="search"
            dir={dir}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onSearchKey}
            placeholder={labels.searchPlaceholder}
            aria-label={labels.searchPlaceholder}
            aria-controls={listId}
            aria-activedescendant={rows[active] ? optionId(rows[active].key) : undefined}
            aria-autocomplete="list"
            className="t-ui h-11 w-full rounded-[8px] border border-[var(--g7-teal-900)]/20 bg-transparent pe-3 ps-9 outline-none focus:border-[var(--g7-gold-500)] focus-visible:ring-2 focus-visible:ring-[var(--g7-gold-500)]/40"
          />
        </div>
        {atMax ? <p className="t-small mt-1.5 px-1 text-[var(--g7-muted,#6b7a7e)]">{labels.maxReached(maxSelections)}</p> : null}
      </div>

      <div
        ref={listRef}
        id={listId}
        role="listbox"
        aria-multiselectable="true"
        aria-labelledby={labelledBy}
        // Clicks keep the focus in the search box, so the keyboard (Esc, arrows) keeps working.
        onMouseDown={(e) => e.preventDefault()}
        className={cn("overflow-y-auto overscroll-contain", sheet ? "flex-1" : "max-h-[320px]")}
      >
        {filtered.length === 0 ? <p className="t-ui px-4 py-6 text-center text-[var(--g7-muted,#6b7a7e)]">{labels.noResults}</p> : null}
        {filtered.map(({ group, items }) => {
          const headerId = `${uid}-grp-${group.id}`;
          const allPicked = group.items.every((i) => selected.has(i.slug));
          return (
            <div key={group.id} role="group" aria-labelledby={showGroupHeaders ? headerId : undefined}>
              {showGroupHeaders ? (
                <div className="sticky top-0 z-[1] flex min-h-10 items-center justify-between gap-2 border-b border-[var(--g7-teal-900)]/10 bg-[var(--g7-cream-50,#f7f0e6)] px-3">
                  <span id={headerId} className="t-small font-medium">
                    {group.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => onChange(allPicked ? clearGroup(value, group) : selectGroup(value, group, maxSelections))}
                    className="t-small min-h-10 rounded px-2 font-medium text-[var(--g7-gold-600,#af7d27)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--g7-gold-500)]"
                  >
                    {allPicked ? labels.deselectAll : labels.selectAll}
                  </button>
                </div>
              ) : null}
              {items.map(({ item }) => {
                const groupRows = rows.filter((r) => r.item.slug === item.slug && r.groupId === group.id);
                return (
                  <Fragment key={item.slug}>
                    {groupRows.map((row) => {
                      const index = rows.indexOf(row);
                      const isActive = index === active;
                      const isVariant = row.kind === "variant";
                      const checked = selected.has(row.key);
                      const partial = !isVariant && !checked && row.hasVariants && value.some((k) => parseKey(k)?.slug === item.slug);
                      const label = isVariant ? row.label : item.label;
                      return (
                        <div
                          key={row.key}
                          id={optionId(row.key)}
                          role="option"
                          aria-selected={checked}
                          aria-checked={partial ? "mixed" : checked}
                          aria-expanded={!isVariant && row.hasVariants ? row.expanded : undefined}
                          data-level={isVariant ? 2 : 1}
                          onMouseMove={() => setActive(index)}
                          onClick={() => toggle(row.key)}
                          className={cn(
                            "flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2 text-start",
                            isVariant && "ps-12",
                            isActive && "bg-[var(--g7-teal-900)]/[0.06] outline outline-2 -outline-offset-2 outline-[var(--g7-gold-500)]"
                          )}
                        >
                          <span
                            aria-hidden
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border",
                              checked || partial ? "border-[var(--g7-teal-900)] bg-[var(--g7-teal-900)] text-[var(--g7-cream-50,#f7f0e6)]" : "border-[var(--g7-teal-900)]/40 bg-white"
                            )}
                          >
                            {checked ? <Check size={14} strokeWidth={3} /> : partial ? <Minus size={14} strokeWidth={3} /> : null}
                          </span>
                          {showThumbnails && !isVariant ? (
                            item.thumbUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element -- tiny catalog thumbnail
                              <img src={item.thumbUrl} alt="" loading="lazy" className="h-9 w-9 shrink-0 rounded-[6px] bg-[var(--g7-cream-50)] object-cover" />
                            ) : (
                              <span aria-hidden className="h-9 w-9 shrink-0 rounded-[6px] bg-[var(--g7-cream-50,#f7f0e6)]" />
                            )
                          ) : null}
                          {/* Full name, wrapping onto a second line -- never truncated. */}
                          <span className="t-ui min-w-0 flex-1 whitespace-normal break-words leading-snug">
                            {label}
                            {!isVariant && row.hasVariants && checked ? <span className="t-small ms-1.5 text-[var(--g7-muted,#6b7a7e)]">({labels.anyVariant})</span> : null}
                          </span>
                          {!isVariant && row.hasVariants ? (
                            <button
                              type="button"
                              tabIndex={-1}
                              aria-label={labels.expand(item.label)}
                              aria-expanded={row.expanded}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpanded(item.slug);
                              }}
                              className="-me-2 flex h-11 w-11 shrink-0 items-center justify-center rounded text-[var(--g7-muted,#6b7a7e)] hover:bg-[var(--g7-teal-900)]/[0.06]"
                            >
                              <ChevronDown size={18} className={cn("transition-transform", row.expanded && "rotate-180")} />
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                  </Fragment>
                );
              })}
            </div>
          );
        })}
      </div>

      {sheet ? (
        <div className="shrink-0 border-t border-[var(--g7-teal-900)]/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => close()}
            className="t-ui flex h-12 w-full items-center justify-center rounded-[8px] bg-[var(--g7-teal-900)] font-medium text-[var(--g7-cream-50,#f7f0e6)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--g7-gold-500)]"
          >
            {labels.done} ({value.length.toLocaleString(dir === "rtl" ? "ar-EG" : "en-US")})
          </button>
        </div>
      ) : null}
    </div>
  ) : null;

  return (
    <div ref={wrapRef} className="relative" data-multi-select>
      <div
        ref={triggerRef}
        id={id}
        role="combobox"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        aria-disabled={disabled || undefined}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          if (open) close(false);
          else openPanel();
        }}
        onKeyDown={onTriggerKey}
        className={cn(
          triggerClassName,
          "flex h-auto cursor-pointer items-center gap-2 py-1.5 pe-2 text-start aria-[invalid=true]:border-red-700",
          open && "border-[var(--g7-gold-500)]"
        )}
      >
        <SelectedChips catalog={catalog} value={value} labels={labels} onRemove={(k) => onChange(value.filter((v) => v !== k))} />
        <ChevronDown size={18} aria-hidden className={cn("shrink-0 text-[var(--g7-muted,#6b7a7e)] transition-transform", open && "rotate-180")} />
      </div>
      {/* Under the field (end side), so the chips get the trigger's full width in narrow columns. */}
      {value.length > 0 ? (
        <div className="mt-1 flex justify-end">
          <button
            type="button"
            onClick={() => onChange([])}
            className="t-small relative rounded px-1.5 py-1 text-[var(--g7-muted,#6b7a7e)] underline underline-offset-2 after:absolute after:-inset-x-1 after:-inset-y-2.5 hover:text-[var(--g7-teal-900)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--g7-gold-500)]"
          >
            {labels.clearAll}
          </button>
        </div>
      ) : null}

      {value.map((key) => (
        <input key={key} type="hidden" name={name} value={key} />
      ))}

      {sheet && open ? <div aria-hidden className="fixed inset-0 z-40 bg-black/40" onClick={() => close(false)} /> : null}
      {panel}
    </div>
  );
}

/**
 * Chips with full text; when they would need a third line, the tail collapses into «+n». A hidden
 * copy measures each chip's width and fitChips() simulates the wrap, so the row never passes two lines.
 */
function SelectedChips({ catalog, value, labels, onRemove }: { catalog: QuoteCatalogItem[]; value: string[]; labels: MultiSelectLabels; onRemove: (key: string) => void }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(value.length);
  const chips = value.map((key) => ({ key, label: keyLabel(catalog, key) ?? key }));

  useLayoutEffect(() => {
    const measure = () => {
      const box = measureRef.current;
      if (!box) return;
      const nodes = Array.from(box.querySelectorAll<HTMLElement>("[data-measure-chip]"));
      const more = box.querySelector<HTMLElement>("[data-measure-more]");
      const gap = parseFloat(getComputedStyle(box).columnGap) || 0;
      setVisible(fitChips(nodes.map((n) => n.offsetWidth), more?.offsetWidth ?? 0, box.clientWidth, gap));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (boxRef.current) ro.observe(boxRef.current);
    return () => ro.disconnect();
  }, [value]);

  if (chips.length === 0) return <span className="t-ui min-w-0 flex-1 py-1.5 text-[var(--g7-muted)]/80">{labels.placeholder}</span>;

  const chip = "t-small inline-flex max-w-full shrink-0 items-center gap-1 rounded-full bg-[var(--g7-teal-900)]/[0.08] py-1 pe-1 ps-2.5 text-[var(--g7-teal-900)]";
  const hidden = chips.length - visible;
  return (
    <div ref={boxRef} className="relative min-w-0 flex-1">
      <div aria-hidden className="invisible absolute inset-x-0 top-0 flex flex-wrap gap-1.5" ref={measureRef}>
        {chips.map((c) => (
          <span key={c.key} className={chip} data-measure-chip>
            <span className="min-w-0 truncate">{c.label}</span>
            <span className="h-5 w-5" />
          </span>
        ))}
        <span className={cn(chip, "pe-2.5 font-medium")} data-measure-more>
          {labels.more(Math.max(chips.length, 10))}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {chips.slice(0, visible).map((c) => (
          <span key={c.key} className={chip} data-chip>
            <span className="min-w-0 truncate" title={c.label}>{c.label}</span>
            <button
              type="button"
              aria-label={labels.remove(c.label)}
              onClick={() => onRemove(c.key)}
              className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full after:absolute after:-inset-3 hover:bg-[var(--g7-teal-900)]/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--g7-gold-500)]"
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          </span>
        ))}
        {hidden > 0 ? (
          <span className={cn(chip, "pe-2.5 font-medium")} data-chip-more>
            {labels.more(hidden)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
