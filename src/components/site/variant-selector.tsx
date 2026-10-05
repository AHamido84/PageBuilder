"use client";

import { useId, useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { StyledText } from "@/components/text/styled-text";
import { selectValue, valueStates, type OptionView, type ProductVariantsView, type VariantView } from "@/lib/catalog/variants/core";

export interface VariantSelectorLabels {
  /** Tooltip on a value that doesn't exist with the current selection. */
  unavailableCombo: string;
  /** Badge next to the label when the selected variant is marked unavailable. */
  currentlyUnavailable: string;
}

/** Above this many values a pill/image group becomes a native select. */
const SELECT_THRESHOLD = 8;

/**
 * One selector group per option type, rendered by its `display` (pills / color swatches / image
 * tiles / select). Each group is a WAI-ARIA radiogroup with a roving tabindex: Tab enters the group
 * on the selected value, arrow keys move AND select (skipping unavailable values), Home/End jump.
 * Values that don't exist with the current selection stay visible, aria-disabled, with a tooltip.
 * Tap targets are at least 44px.
 */
export function VariantSelector({
  view,
  current,
  onChange,
  labels,
  tone = "light",
}: {
  view: ProductVariantsView;
  current: VariantView;
  onChange: (variant: VariantView) => void;
  labels: VariantSelectorLabels;
  tone?: "light" | "dark";
}) {
  if (view.type !== "VARIANT" || view.options.length === 0 || view.variants.length < 2) return null;
  return (
    <div className="space-y-5" data-variant-selector>
      {view.options.map((option) => (
        <OptionGroup key={option.key} view={view} option={option} current={current} onChange={onChange} labels={labels} tone={tone} />
      ))}
    </div>
  );
}

function OptionGroup({
  view,
  option,
  current,
  onChange,
  labels,
  tone,
}: {
  view: ProductVariantsView;
  option: OptionView;
  current: VariantView;
  onChange: (variant: VariantView) => void;
  labels: VariantSelectorLabels;
  tone: "light" | "dark";
}) {
  const labelId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const states = valueStates(view, current, option.key);
  const selected = option.values.find((v) => v.key === current.options[option.key]);
  const asSelect = option.display === "SELECT" || option.values.length > SELECT_THRESHOLD;

  function pick(valueKey: string) {
    if (states[valueKey] === "disabled" || states[valueKey] === "selected") return;
    onChange(selectValue(view, current, option.key, valueKey));
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const keys = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const forward = e.key === "ArrowDown" || (e.key === "ArrowRight" ? !rtl : e.key === "ArrowLeft" ? rtl : false);
    const enabled = option.values.map((v, i) => ({ v, i })).filter(({ v }) => states[v.key] !== "disabled");
    if (enabled.length === 0) return;
    let target: number;
    if (e.key === "Home") target = enabled[0].i;
    else if (e.key === "End") target = enabled[enabled.length - 1].i;
    else {
      const pos = enabled.findIndex(({ i }) => i === index);
      const nextPos = forward ? (pos + 1) % enabled.length : (pos - 1 + enabled.length) % enabled.length;
      target = enabled[nextPos === -1 ? 0 : nextPos].i;
    }
    refs.current[target]?.focus();
    pick(option.values[target].key);
  }

  const heading = (
    <p id={labelId} className="mb-2 text-sm">
      <span className="font-medium">
        <StyledText text={option.label} rich={option.labelRich} />:
      </span>{" "}
      <span className={tone === "dark" ? "text-neutral-300" : "text-ink/70"}>{selected ? <StyledText text={selected.label} rich={selected.labelRich} /> : "—"}</span>
      {!current.available ? (
        <span className="ms-2 rounded-[6px] bg-[var(--g7-gold-500)]/15 px-2 py-0.5 text-xs text-[var(--g7-gold-600)]">{labels.currentlyUnavailable}</span>
      ) : null}
    </p>
  );

  if (asSelect) {
    return (
      <div>
        {heading}
        <select
          aria-labelledby={labelId}
          value={current.options[option.key] ?? ""}
          onChange={(e) => pick(e.target.value)}
          className={cn(
            "min-h-11 w-full max-w-sm rounded-[6px] border px-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--g7-gold-500)]",
            tone === "dark" ? "border-neutral-600 bg-neutral-800 text-neutral-100" : "border-line bg-paper"
          )}
        >
          {option.values.map((v) => (
            <option key={v.key} value={v.key} disabled={states[v.key] === "disabled"}>
              {v.label}
              {states[v.key] === "disabled" ? ` — ${labels.unavailableCombo}` : ""}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      {heading}
      <div role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {option.values.map((value, index) => {
          const state = states[value.key];
          const isSelected = state === "selected";
          const disabled = state === "disabled";
          const common = {
            ref: (el: HTMLButtonElement | null) => {
              refs.current[index] = el;
            },
            type: "button" as const,
            role: "radio",
            "aria-checked": isSelected,
            "aria-disabled": disabled || undefined,
            tabIndex: isSelected ? 0 : -1,
            title: disabled ? labels.unavailableCombo : undefined,
            onClick: () => pick(value.key),
            onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => onKeyDown(e, index),
            "data-value": value.key,
          };
          const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--g7-gold-500)]";

          if (option.display === "SWATCH" && value.swatchHex) {
            return (
              <button
                key={value.key}
                {...common}
                aria-label={value.label}
                className={cn(
                  "relative h-11 w-11 rounded-full border-2 transition-[border-color,opacity]",
                  focusRing,
                  isSelected ? "border-[var(--g7-gold-500)]" : tone === "dark" ? "border-neutral-600" : "border-line",
                  disabled ? "cursor-not-allowed opacity-35" : "cursor-pointer"
                )}
              >
                <span className="absolute inset-1 rounded-full" style={{ backgroundColor: value.swatchHex }} aria-hidden="true" />
                {disabled ? <span className="absolute inset-0 m-auto h-0.5 w-9 rotate-45 bg-current opacity-60" aria-hidden="true" /> : null}
              </button>
            );
          }

          if (option.display === "IMAGE" && value.imageUrl) {
            return (
              <button
                key={value.key}
                {...common}
                className={cn(
                  "flex w-20 flex-col items-center gap-1 rounded-[8px] border-2 p-1 text-xs transition-[border-color,opacity]",
                  focusRing,
                  isSelected ? "border-[var(--g7-gold-500)]" : tone === "dark" ? "border-neutral-700" : "border-line",
                  disabled ? "cursor-not-allowed opacity-35" : "cursor-pointer"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- admin-uploaded value image, tiny tile */}
                <img src={value.imageUrl} alt="" className="h-14 w-full rounded-[6px] object-cover" />
                <span className={cn("line-clamp-1", disabled && "line-through")}>
                  <StyledText text={value.label} rich={value.labelRich} />
                </span>
              </button>
            );
          }

          return (
            <button
              key={value.key}
              {...common}
              className={cn(
                "min-h-11 min-w-11 rounded-[6px] border px-4 text-base transition-[background-color,border-color,color,opacity]",
                focusRing,
                isSelected
                  ? "border-[var(--g7-teal-800)] bg-[var(--g7-teal-800)] text-[var(--g7-cream-50)]"
                  : tone === "dark"
                    ? "border-neutral-600 text-neutral-100 hover:border-neutral-300"
                    : "border-line text-ink hover:border-[var(--g7-teal-800)]",
                disabled ? "cursor-not-allowed border-dashed opacity-40 line-through hover:border-line" : "cursor-pointer"
              )}
            >
              <StyledText text={value.label} rich={value.labelRich} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
