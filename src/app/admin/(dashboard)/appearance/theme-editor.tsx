"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ChevronDown, ExternalLink, Monitor, RotateCcw, Smartphone, Tablet } from "lucide-react";
import { useAdminToast } from "@/components/admin/ui/toast";
import { useConfirm } from "@/components/admin/ui/confirm-dialog";
import {
  ANIMATION_DEFAULT_OPTIONS,
  ARABIC_FONTS,
  ENGLISH_FONTS,
  ENGLISH_HEADING_FONTS,
  DESIGN_TOKENS_VERSION,
  pruneTokens,
  type DesignTokens,
  type EditableButtonVariant,
  type ButtonVariantColors,
  type ShadowPreset,
} from "@/lib/design-tokens/schema";
import { buildDesignTokensCss } from "@/lib/design-tokens/resolve-css";
import { DEFAULT_COLORS, DEFAULT_LAYOUT, DEFAULT_SHADOWS, DEFAULT_SHADOW_COLOR } from "@/lib/design-tokens/defaults";
import { THEME_PREVIEW_MESSAGE } from "@/components/site/theme-preview-receiver";
import { saveThemeAction } from "./actions";

// ---------------------------------------------------------------------------------------------
// State helpers: tokens are edited as a plain nested object addressed by path ("colors.primary").
// Setting a field to undefined removes the override (= back to the site's default).
// ---------------------------------------------------------------------------------------------

type Tokens = DesignTokens;

function getIn(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined), obj);
}

function setIn<T>(obj: T, path: string, value: unknown): T {
  const [head, ...rest] = path.split(".");
  const base = (obj && typeof obj === "object" ? obj : {}) as Record<string, unknown>;
  const next = { ...base, [head]: rest.length ? setIn(base[head], rest.join("."), value) : value };
  return next as T;
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function expandHex(hex: string): string {
  return hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
}

/** Linear sRGB mix -- only used to *display* the approximate default of derived colors (hover shades). */
function mixHex(a: string, b: string, weightOfA: number): string {
  const pa = parseInt(expandHex(a).slice(1), 16);
  const pb = parseInt(expandHex(b).slice(1), 16);
  const ch = (shift: number) => Math.round(((pa >> shift) & 255) * weightOfA + ((pb >> shift) & 255) * (1 - weightOfA));
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, "0")).join("")}`;
}

// ---------------------------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------------------------

const inputClass = "rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm text-neutral-100 disabled:opacity-60";

function ResetButton({ visible, onClick, label }: { visible: boolean; onClick: () => void; label: string }) {
  if (!visible) return <span className="w-6" />;
  return (
    <button type="button" onClick={onClick} title={`Reset ${label} to default`} aria-label={`Reset ${label} to default`} className="w-6 shrink-0 rounded p-1 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200">
      <RotateCcw size={12} />
    </button>
  );
}

function ColorControl({ label, hint, value, fallback, allowTransparent, onChange }: { label: string; hint?: string; value?: string; fallback: string; allowTransparent?: boolean; onChange: (v: string | undefined) => void }) {
  const [draft, setDraft] = useState(value ?? "");
  const [lastValue, setLastValue] = useState(value);
  // Keep the text box in sync when the value changes from outside (reset, discard, load).
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value ?? "");
  }
  const shown = value && value !== "transparent" ? expandHex(value) : fallback === "transparent" ? "#ffffff" : expandHex(fallback);

  return (
    <div className="flex items-center gap-2 py-1">
      <input
        type="color"
        aria-label={`${label} color`}
        value={shown}
        onChange={(e) => onChange(e.target.value)}
        className={`h-8 w-10 shrink-0 cursor-pointer rounded border border-neutral-700 bg-transparent p-0.5 ${value ? "" : "opacity-60"}`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-neutral-200">{label}</p>
        {hint ? <p className="truncate text-[11px] text-neutral-500" title={hint}>{hint}</p> : null}
      </div>
      <input
        value={draft}
        placeholder={fallback === "transparent" ? "transparent" : expandHex(fallback)}
        aria-label={`${label} hex value`}
        onChange={(e) => {
          const next = e.target.value.trim();
          setDraft(next);
          if (next === "") onChange(undefined);
          else if (HEX.test(next) || (allowTransparent && next === "transparent")) onChange(next.toLowerCase());
        }}
        className={`${inputClass} w-24 font-mono text-xs ${draft && !HEX.test(draft) && !(allowTransparent && draft === "transparent") ? "border-red-700" : ""}`}
      />
      <ResetButton visible={value !== undefined} onClick={() => onChange(undefined)} label={label} />
    </div>
  );
}

function RangeControl({ label, value, fallback, min, max, step, unit, onChange }: { label: string; value?: number; fallback: number; min: number; max: number; step: number; unit?: string; onChange: (v: number | undefined) => void }) {
  const shown = value ?? fallback;
  return (
    <div className="py-1">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs text-neutral-200">{label}</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            aria-label={label}
            value={shown}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (e.target.value !== "" && Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
            }}
            className={`${inputClass} w-20 py-1 text-end text-xs ${value === undefined ? "text-neutral-500" : ""}`}
          />
          <span className="w-7 text-[11px] text-neutral-500">{unit ?? ""}</span>
          <ResetButton visible={value !== undefined} onClick={() => onChange(undefined)} label={label} />
        </div>
      </div>
      <input
        type="range"
        aria-label={`${label} slider`}
        min={min}
        max={max}
        step={step}
        value={shown}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`mt-1 w-full accent-emerald-500 ${value === undefined ? "opacity-50" : ""}`}
      />
    </div>
  );
}

function SelectControl({ label, value, defaultLabel, options, onChange }: { label: string; value?: string; defaultLabel: string; options: { value: string; label: string }[]; onChange: (v: string | undefined) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <label className="text-xs text-neutral-200">{label}</label>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value || undefined)} aria-label={label} className={`${inputClass} w-48 text-xs`}>
        <option value="">{defaultLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TriStateControl({ label, value, onChange }: { label: string; value?: boolean; onChange: (v: boolean | undefined) => void }) {
  return (
    <SelectControl
      label={label}
      value={value === undefined ? undefined : String(value)}
      defaultLabel="Default"
      options={[
        { value: "true", label: "On" },
        { value: "false", label: "Off" },
      ]}
      onChange={(v) => onChange(v === undefined ? undefined : v === "true")}
    />
  );
}

function Group({ title, description, children, defaultOpen = false, count }: { title: string; description?: string; children: React.ReactNode; defaultOpen?: boolean; count: number }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-lg border border-neutral-800 bg-neutral-900">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-2 px-4 py-3 text-start">
        <span className="flex-1 text-sm font-medium text-neutral-100">{title}</span>
        {count > 0 ? <span className="rounded-full bg-emerald-900/60 px-2 py-0.5 text-[10px] text-emerald-300">{count} customized</span> : null}
        <ChevronDown size={14} className={`text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="border-t border-neutral-800 px-4 pb-4 pt-2">
          {description ? <p className="mb-2 text-[11px] text-neutral-500">{description}</p> : null}
          {children}
        </div>
      ) : null}
    </section>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 mt-4 text-[10px] font-medium uppercase tracking-wider text-neutral-500 first:mt-1">{children}</p>;
}

/** How many leaf values are set under a path -- shown as "N customized" on each group. */
function countSet(value: unknown): number {
  if (value === undefined || value === null || value === "") return 0;
  if (typeof value !== "object") return 1;
  return Object.values(value as Record<string, unknown>).reduce<number>((n, v) => n + countSet(v), 0);
}

// ---------------------------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------------------------

const DEVICES = {
  desktop: { width: 1280, icon: Monitor, label: "Desktop" },
  tablet: { width: 820, icon: Tablet, label: "Tablet" },
  mobile: { width: 390, icon: Smartphone, label: "Mobile" },
} as const;
type Device = keyof typeof DEVICES;
const PREVIEW_HEIGHT = 1100;

function LivePreview({ css }: { css: string }) {
  const [page, setPage] = useState<"theme-preview" | "">("theme-preview");
  const [locale, setLocale] = useState<"en" | "ar">("en");
  const [device, setDevice] = useState<Device>("desktop");
  const [paneWidth, setPaneWidth] = useState(0);
  const paneRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const cssRef = useRef(css);

  const send = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: THEME_PREVIEW_MESSAGE, css: cssRef.current }, window.location.origin);
  }, []);

  useEffect(() => {
    cssRef.current = css;
    const t = setTimeout(send, 60);
    return () => clearTimeout(t);
  }, [css, send]);

  // The framed page announces itself once its listener is ready (it may finish loading after us).
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin === window.location.origin && event.source === iframeRef.current?.contentWindow && event.data?.type === "theme-preview:ready") send();
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [send]);

  useEffect(() => {
    const el = paneRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setPaneWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const deviceWidth = DEVICES[device].width;
  const scale = paneWidth ? Math.min(1, paneWidth / deviceWidth) : 1;
  const src = `/${locale}${page ? `/${page}` : ""}`;

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900">
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-800 px-3 py-2">
        <span className="me-1 text-xs font-medium text-neutral-300">Live preview</span>
        <div className="flex rounded-md border border-neutral-700 p-0.5 text-xs">
          {([
            ["theme-preview", "Style guide"],
            ["", "Homepage"],
          ] as const).map(([value, label]) => (
            <button key={label} type="button" onClick={() => setPage(value)} className={`rounded px-2 py-1 ${page === value ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-neutral-200"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex rounded-md border border-neutral-700 p-0.5 text-xs">
          {(["en", "ar"] as const).map((l) => (
            <button key={l} type="button" onClick={() => setLocale(l)} className={`rounded px-2 py-1 ${locale === l ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-neutral-200"}`}>
              {l === "en" ? "English" : "العربية"}
            </button>
          ))}
        </div>
        <div className="flex rounded-md border border-neutral-700 p-0.5">
          {(Object.keys(DEVICES) as Device[]).map((d) => {
            const Icon = DEVICES[d].icon;
            return (
              <button key={d} type="button" onClick={() => setDevice(d)} aria-label={DEVICES[d].label} title={DEVICES[d].label} className={`rounded px-2 py-1 ${device === d ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-neutral-200"}`}>
                <Icon size={13} />
              </button>
            );
          })}
        </div>
        <a href={src} target="_blank" rel="noreferrer" className="ms-auto inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-200" title="Opens the saved version">
          <ExternalLink size={11} /> Open
        </a>
      </div>
      <div ref={paneRef} className="overflow-hidden bg-neutral-950" style={{ height: PREVIEW_HEIGHT * scale }}>
        <iframe
          ref={iframeRef}
          key={src}
          src={src}
          title="Live theme preview"
          onLoad={send}
          className="origin-top-left border-0 bg-white"
          style={{
            width: deviceWidth,
            height: PREVIEW_HEIGHT,
            transform: `scale(${scale})`,
            marginInlineStart: scale === 1 ? Math.max(0, (paneWidth - deviceWidth) / 2) : 0,
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------------------------

const fontOptions = (fonts: Record<string, string>) => Object.entries(fonts).map(([value, label]) => ({ value, label }));
const WEIGHTS = ["300", "400", "500", "600", "700", "800"].map((w) => ({ value: w, label: w }));

const BUTTON_LABELS: Record<EditableButtonVariant, string> = {
  primary: "Primary button",
  secondary: "Secondary button",
  gold: "Gold button",
  ghostGold: "Ghost gold button",
};

export function ThemeEditor({ initialTokens, canUpdate }: { initialTokens: Tokens; canUpdate: boolean }) {
  const [saved, setSaved] = useState<Tokens>(() => pruneTokens(initialTokens));
  const [tokens, setTokens] = useState<Tokens>(() => pruneTokens(initialTokens));
  const [pending, startTransition] = useTransition();
  const toast = useAdminToast();
  const confirm = useConfirm();

  const css = useMemo(() => buildDesignTokensCss(tokens), [tokens]);
  const dirty = JSON.stringify(pruneTokens(tokens)) !== JSON.stringify(pruneTokens(saved));

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const val = <V,>(path: string) => getIn(tokens, path) as V | undefined;
  const set = (path: string) => (value: unknown) => setTokens((prev) => setIn(prev, path, value));

  const colors = { ...DEFAULT_COLORS, ...pruneTokens(tokens.colors ?? {}) };

  // Default colors each button style uses (mirrors the --btn-* defaults in globals.css).
  const buttonDefaults: Record<EditableButtonVariant, Required<Record<keyof ButtonVariantColors, string>>> = {
    primary: { bg: colors.secondary, text: colors.background, border: "transparent", hoverBg: mixHex(colors.secondary, "#000000", 0.85), hoverText: colors.background },
    secondary: { bg: colors.primary, text: colors.background, border: "transparent", hoverBg: colors.text, hoverText: colors.background },
    gold: { bg: colors.gold, text: colors.text, border: "transparent", hoverBg: mixHex(colors.gold, "#000000", 0.85), hoverText: colors.text },
    ghostGold: { bg: "transparent", text: colors.gold, border: colors.gold, hoverBg: colors.gold, hoverText: colors.text },
  };
  const buttonDefaultHints: Record<EditableButtonVariant, Record<keyof ButtonVariantColors, string>> = {
    primary: { bg: "Default: Secondary color", text: "Default: Background color", border: "Default: none", hoverBg: "Default: Secondary, darker", hoverText: "Default: Background color" },
    secondary: { bg: "Default: Primary color", text: "Default: Background color", border: "Default: none", hoverBg: "Default: Text color", hoverText: "Default: Background color" },
    gold: { bg: "Default: Gold color", text: "Default: Text color", border: "Default: none", hoverBg: "Default: Gold, darker", hoverText: "Default: Text color" },
    ghostGold: { bg: "Default: transparent", text: "Default: Gold color", border: "Default: Gold color", hoverBg: "Default: Gold color", hoverText: "Default: Text color" },
  };

  function save() {
    startTransition(async () => {
      const result = await saveThemeAction({ ...pruneTokens(tokens), version: DESIGN_TOKENS_VERSION });
      if (!result.ok) {
        toast.push({ title: "Couldn't save the theme", description: result.error, tone: "error" });
        return;
      }
      const next = pruneTokens(result.tokens);
      setSaved(next);
      setTokens(next);
      toast.push({ title: "Theme saved", description: "The live site now uses these settings.", tone: "success" });
    });
  }

  async function resetAll() {
    const ok = await confirm({
      title: "Reset every setting to default?",
      description: "Clears all theme customizations in the editor. Nothing changes on the live site until you save.",
      confirmLabel: "Reset all",
      danger: true,
    });
    if (ok) setTokens({ version: DESIGN_TOKENS_VERSION });
  }

  const shadowPreset = (key: "soft" | "medium" | "strong", label: string, hint: string) => {
    const preset = val<ShadowPreset>(`shadows.${key}`);
    const p = preset ?? DEFAULT_SHADOWS[key];
    const setField = (field: keyof ShadowPreset) => (v: number | undefined) => set(`shadows.${key}`)({ ...p, [field]: v ?? DEFAULT_SHADOWS[key][field] });
    return (
      <div className="mt-2 rounded-md border border-neutral-800 p-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-200">{label}</p>
            <p className="text-[11px] text-neutral-500">{hint}</p>
          </div>
          {preset ? (
            <button type="button" onClick={() => set(`shadows.${key}`)(undefined)} className="text-[11px] text-neutral-400 hover:text-neutral-100">
              Use default
            </button>
          ) : (
            <button type="button" onClick={() => set(`shadows.${key}`)({ ...DEFAULT_SHADOWS[key] })} className="text-[11px] text-emerald-400 hover:text-emerald-300">
              Customize
            </button>
          )}
        </div>
        {preset ? (
          <div className="mt-1">
            <RangeControl label="Offset Y" value={p.y} fallback={p.y} min={0} max={64} step={1} unit="px" onChange={setField("y")} />
            <RangeControl label="Blur" value={p.blur} fallback={p.blur} min={0} max={120} step={1} unit="px" onChange={setField("blur")} />
            <RangeControl label="Spread" value={p.spread} fallback={p.spread} min={-40} max={40} step={1} unit="px" onChange={setField("spread")} />
            <RangeControl label="Opacity" value={p.opacity} fallback={p.opacity} min={0} max={0.6} step={0.01} onChange={setField("opacity")} />
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <div className="space-y-3">
        <fieldset disabled={!canUpdate} className="space-y-3">
          <Group title="Colors" count={countSet(tokens.colors)} defaultOpen description="Each color drives every place on the site that uses it. Leave a color on default to keep the current design.">
            <ColorControl label="Primary" hint="Brand green: secondary buttons, footer, brand sections" value={val("colors.primary")} fallback={DEFAULT_COLORS.primary} onChange={set("colors.primary")} />
            <ColorControl label="Secondary" hint="CTA accent: primary buttons by default" value={val("colors.secondary")} fallback={DEFAULT_COLORS.secondary} onChange={set("colors.secondary")} />
            <ColorControl label="Accent" hint="Links, labels and highlights" value={val("colors.accent")} fallback={DEFAULT_COLORS.accent} onChange={set("colors.accent")} />
            <ColorControl label="Gold" hint="Gold buttons, badges, focus rings" value={val("colors.gold")} fallback={DEFAULT_COLORS.gold} onChange={set("colors.gold")} />
            <ColorControl label="Background" hint="Page background" value={val("colors.background")} fallback={DEFAULT_COLORS.background} onChange={set("colors.background")} />
            <ColorControl label="Surface" hint="Alternate sections and panels" value={val("colors.surface")} fallback={DEFAULT_COLORS.surface} onChange={set("colors.surface")} />
            <ColorControl label="Text" hint="Body text and dark sections" value={val("colors.text")} fallback={DEFAULT_COLORS.text} onChange={set("colors.text")} />
            <ColorControl label="Muted text" hint="Captions and secondary text" value={val("colors.mutedText")} fallback={DEFAULT_COLORS.mutedText} onChange={set("colors.mutedText")} />
            <ColorControl label="Border" hint="Card outlines and dividers" value={val("colors.border")} fallback={DEFAULT_COLORS.border} onChange={set("colors.border")} />
          </Group>

          <Group title="Typography" count={countSet(tokens.typography)} description="Fonts are served from this site (no external requests). Sizes are multipliers on the responsive type scale, so headings still shrink on small screens.">
            <SubHeading>Fonts</SubHeading>
            <SelectControl label="Heading font (English)" value={val("typography.fontHeadingEn")} defaultLabel="Default (Archivo)" options={fontOptions(ENGLISH_HEADING_FONTS).filter((o) => o.value !== "archivo")} onChange={set("typography.fontHeadingEn")} />
            <SelectControl label="Heading font (Arabic)" value={val("typography.fontHeadingAr")} defaultLabel="Default (same as Arabic body)" options={fontOptions(ARABIC_FONTS)} onChange={set("typography.fontHeadingAr")} />
            <SelectControl label="Body font (English)" value={val("typography.fontEn")} defaultLabel="Default (Public Sans)" options={fontOptions(ENGLISH_FONTS).filter((o) => o.value !== "public-sans")} onChange={set("typography.fontEn")} />
            <SelectControl label="Body font (Arabic)" value={val("typography.fontAr")} defaultLabel="Default (IBM Plex Sans Arabic)" options={fontOptions(ARABIC_FONTS).filter((o) => o.value !== "plex-arabic")} onChange={set("typography.fontAr")} />
            <SubHeading>Headings</SubHeading>
            <SelectControl label="Weight" value={val<number>("typography.weightHeading")?.toString()} defaultLabel="Default" options={WEIGHTS} onChange={(v) => set("typography.weightHeading")(v ? Number(v) : undefined)} />
            <RangeControl label="Display size" value={val("typography.displaySize")} fallback={1} min={0.75} max={1.5} step={0.05} unit="×" onChange={set("typography.displaySize")} />
            <RangeControl label="H1 size" value={val("typography.h1Size")} fallback={1} min={0.75} max={1.5} step={0.05} unit="×" onChange={set("typography.h1Size")} />
            <RangeControl label="H2 size" value={val("typography.h2Size")} fallback={1} min={0.75} max={1.5} step={0.05} unit="×" onChange={set("typography.h2Size")} />
            <RangeControl label="H3 size" value={val("typography.h3Size")} fallback={1} min={0.75} max={1.5} step={0.05} unit="×" onChange={set("typography.h3Size")} />
            <RangeControl label="Line height" value={val("typography.lineHeightHeading")} fallback={1} min={0.8} max={1.4} step={0.02} unit="×" onChange={set("typography.lineHeightHeading")} />
            <RangeControl label="Letter spacing" value={val("typography.letterSpacingExtra")} fallback={0} min={-0.05} max={0.1} step={0.005} unit="em" onChange={set("typography.letterSpacingExtra")} />
            <SubHeading>Body</SubHeading>
            <SelectControl label="Weight" value={val<number>("typography.weightBody")?.toString()} defaultLabel="Default" options={WEIGHTS} onChange={(v) => set("typography.weightBody")(v ? Number(v) : undefined)} />
            <RangeControl label="Size" value={val("typography.bodySize")} fallback={1} min={0.75} max={1.5} step={0.05} unit="×" onChange={set("typography.bodySize")} />
            <RangeControl label="Line height" value={val("typography.lineHeightBody")} fallback={1} min={0.8} max={1.4} step={0.02} unit="×" onChange={set("typography.lineHeightBody")} />
            <RangeControl label="Letter spacing" value={val("typography.letterSpacingBody")} fallback={0} min={-0.05} max={0.1} step={0.005} unit="em" onChange={set("typography.letterSpacingBody")} />
          </Group>

          <Group title="Spacing" count={countSet(tokens.layout?.containerWidth) + countSet(tokens.layout?.sectionSpacingScale) + countSet(tokens.layout?.gridGap) + countSet(tokens.layout?.cardGap) + countSet(tokens.buttons?.paddingScale)}>
            <RangeControl label="Container width" value={val("layout.containerWidth")} fallback={DEFAULT_LAYOUT.containerWidth} min={960} max={1920} step={20} unit="px" onChange={set("layout.containerWidth")} />
            <RangeControl label="Section spacing" value={val("layout.sectionSpacingScale")} fallback={1} min={0.5} max={2} step={0.05} unit="×" onChange={set("layout.sectionSpacingScale")} />
            <RangeControl label="Grid gap" value={val("layout.gridGap")} fallback={DEFAULT_LAYOUT.gridGap} min={0} max={4} step={0.125} unit="rem" onChange={set("layout.gridGap")} />
            <RangeControl label="Card gap" value={val("layout.cardGap")} fallback={DEFAULT_LAYOUT.cardGap} min={0} max={4} step={0.125} unit="rem" onChange={set("layout.cardGap")} />
            <RangeControl label="Button spacing" value={val("buttons.paddingScale")} fallback={1} min={0.6} max={1.6} step={0.05} unit="×" onChange={set("buttons.paddingScale")} />
          </Group>

          <Group title="Corner radius" count={countSet(tokens.layout?.buttonRadius) + countSet(tokens.layout?.cardRadius) + countSet(tokens.layout?.imageRadius) + countSet(tokens.layout?.sectionRadius)} description="Setting a card or image radius applies one value to every card or image style on the site.">
            <RangeControl
              label="Buttons"
              value={val("layout.buttonRadius")}
              fallback={DEFAULT_LAYOUT.buttonRadius}
              min={0}
              max={3}
              step={0.0625}
              unit="rem"
              onChange={(v) => setTokens((prev) => setIn(setIn(prev, "layout.buttonRadius", v), "buttons.radius", v))}
            />
            <RangeControl label="Cards" value={val("layout.cardRadius")} fallback={DEFAULT_LAYOUT.cardRadius} min={0} max={3} step={0.0625} unit="rem" onChange={set("layout.cardRadius")} />
            <RangeControl label="Images" value={val("layout.imageRadius")} fallback={DEFAULT_LAYOUT.imageRadius} min={0} max={3} step={0.0625} unit="rem" onChange={set("layout.imageRadius")} />
            <RangeControl label="Sections" value={val("layout.sectionRadius")} fallback={DEFAULT_LAYOUT.sectionRadius} min={0} max={3} step={0.0625} unit="rem" onChange={set("layout.sectionRadius")} />
          </Group>

          <Group title="Shadows" count={countSet(tokens.shadows)} description="Three presets used across cards and buttons. Customize one to edit it.">
            <ColorControl label="Shadow color" value={val("shadows.color")} fallback={DEFAULT_SHADOW_COLOR} onChange={set("shadows.color")} />
            {shadowPreset("soft", "Soft", "Resting cards and buttons")}
            {shadowPreset("medium", "Medium", "Hovered cards and buttons")}
            {shadowPreset("strong", "Strong", "Featured cards")}
          </Group>

          <Group title="Buttons" count={countSet(tokens.buttons) - countSet(tokens.buttons?.paddingScale) - countSet(tokens.buttons?.radius)} description="Radius is under Corner radius and padding under Spacing (they apply to every button style).">
            <SelectControl
              label="Shadow"
              value={val("buttons.shadow")}
              defaultLabel="Default (soft)"
              options={[
                { value: "none", label: "None" },
                { value: "flat", label: "Soft" },
                { value: "card", label: "Medium" },
                { value: "lifted", label: "Strong" },
              ]}
              onChange={set("buttons.shadow")}
            />
            <TriStateControl label="Show button icons" value={val("buttons.showIcon")} onChange={set("buttons.showIcon")} />
            {(Object.keys(BUTTON_LABELS) as EditableButtonVariant[]).map((variant) => (
              <div key={variant}>
                <SubHeading>{BUTTON_LABELS[variant]}</SubHeading>
                {(
                  [
                    ["bg", "Background"],
                    ["text", "Text"],
                    ["border", "Border"],
                    ["hoverBg", "Hover background"],
                    ["hoverText", "Hover text"],
                  ] as const
                ).map(([field, label]) => (
                  <ColorControl
                    key={field}
                    label={label}
                    hint={buttonDefaultHints[variant][field]}
                    value={val(`buttons.${variant}.${field}`)}
                    fallback={buttonDefaults[variant][field]}
                    allowTransparent
                    onChange={set(`buttons.${variant}.${field}`)}
                  />
                ))}
              </div>
            ))}
          </Group>

          <Group title="Animation" count={countSet(tokens.animation)}>
            <TriStateControl label="Animations enabled" value={val("animation.enabled")} onChange={set("animation.enabled")} />
            <TriStateControl label="Scroll reveal" value={val("animation.scrollReveal")} onChange={set("animation.scrollReveal")} />
            <TriStateControl label="Hover effects" value={val("animation.hoverAnimation")} onChange={set("animation.hoverAnimation")} />
            <TriStateControl label="Page transitions" value={val("animation.pageTransition")} onChange={set("animation.pageTransition")} />
            <SelectControl label="Default section animation" value={val("animation.defaultAnimation")} defaultLabel="Default (fade up)" options={ANIMATION_DEFAULT_OPTIONS.map((a) => ({ value: a, label: a }))} onChange={set("animation.defaultAnimation")} />
            <RangeControl label="Speed" value={val("animation.speed")} fallback={1} min={0.4} max={2.5} step={0.1} unit="×" onChange={set("animation.speed")} />
          </Group>

          <Group title="Tablet & mobile spacing" count={countSet(tokens.responsive)} description="Optional overrides for smaller screens; anything left on default inherits the larger screen's value.">
            {(["tablet", "mobile"] as const).map((bp) => (
              <div key={bp}>
                <SubHeading>{bp === "tablet" ? "Tablet (under 1024px)" : "Mobile (under 640px)"}</SubHeading>
                <RangeControl label="Section spacing" value={val(`responsive.${bp}.sectionSpacingScale`)} fallback={val<number>("layout.sectionSpacingScale") ?? 1} min={0.5} max={2} step={0.05} unit="×" onChange={set(`responsive.${bp}.sectionSpacingScale`)} />
                <RangeControl label="Grid gap" value={val(`responsive.${bp}.gridGap`)} fallback={val<number>("layout.gridGap") ?? DEFAULT_LAYOUT.gridGap} min={0} max={4} step={0.125} unit="rem" onChange={set(`responsive.${bp}.gridGap`)} />
                <RangeControl label="Card gap" value={val(`responsive.${bp}.cardGap`)} fallback={val<number>("layout.cardGap") ?? DEFAULT_LAYOUT.cardGap} min={0} max={4} step={0.125} unit="rem" onChange={set(`responsive.${bp}.cardGap`)} />
              </div>
            ))}
          </Group>
        </fieldset>
      </div>

      <div className="min-w-0 space-y-3 xl:sticky xl:top-4 xl:self-start">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2">
          <span className={`text-xs ${dirty ? "text-amber-400" : "text-neutral-500"}`}>{dirty ? "Unsaved changes -- the preview shows them, the live site doesn't yet." : "All changes saved."}</span>
          <div className="ms-auto flex items-center gap-2">
            {canUpdate ? (
              <>
                <button type="button" onClick={resetAll} className="rounded-md px-2.5 py-1.5 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100">
                  Reset all
                </button>
                <button type="button" onClick={() => setTokens(saved)} disabled={!dirty || pending} className="rounded-md border border-neutral-700 px-2.5 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800 disabled:opacity-40">
                  Discard changes
                </button>
                <button type="button" onClick={save} disabled={!dirty || pending} className="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-900 disabled:opacity-40">
                  {pending ? "Saving..." : "Save theme"}
                </button>
              </>
            ) : (
              <span className="text-xs text-neutral-500">View only -- you don&apos;t have permission to change settings.</span>
            )}
          </div>
        </div>
        <LivePreview css={css} />
      </div>
    </div>
  );
}
