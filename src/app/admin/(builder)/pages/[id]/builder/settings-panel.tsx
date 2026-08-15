"use client";

import { getBlock } from "@/lib/page-builder/registry";
import type { BuilderSection, Breakpoint, EditorLocale, StyleTokens } from "@/lib/page-builder/types";
import { defaultStyleTokens } from "@/lib/page-builder/types";
import {
  ALIGN_OPTIONS, BACKGROUND_OPTIONS, BODY_SIZE_OPTIONS, COLUMNS_OPTIONS, HEADING_SIZE_OPTIONS, MARGIN_OPTIONS, PADDING_OPTIONS,
} from "@/lib/page-builder/style-tokens";
import { SelectField, CheckboxField } from "@/components/admin/ui/field";
import { SegmentedControl } from "@/components/admin/ui/segmented-control";
import { Tabs } from "@/components/admin/ui/tabs";

interface Props {
  section: BuilderSection;
  device: Breakpoint;
  locale: EditorLocale;
  onLocaleChange: (locale: EditorLocale) => void;
  onUpdateData: (locale: "en" | "ar", data: unknown) => void;
  onUpdateSettings: (next: BuilderSection["settings"]) => void;
}

export function SettingsPanel({ section, device, locale: editorLocale, onLocaleChange, onUpdateData, onUpdateSettings }: Props) {
  const block = getBlock(section.type);
  if (!block) return <div className="p-4 text-sm text-neutral-500">Unknown block type.</div>;

  const data = editorLocale === "ar" ? section.dataAr : section.dataEn;
  const breakpointTokens: Partial<StyleTokens> = device === "desktop" ? section.settings.desktop : device === "tablet" ? section.settings.tablet : section.settings.mobile;
  const resolved: StyleTokens = { ...defaultStyleTokens(), ...section.settings.desktop, ...(device !== "desktop" ? breakpointTokens : {}) };

  function updateToken<K extends keyof StyleTokens>(key: K, value: StyleTokens[K]) {
    if (device === "desktop") {
      onUpdateSettings({ ...section.settings, desktop: { ...section.settings.desktop, [key]: value } });
    } else {
      onUpdateSettings({ ...section.settings, [device]: { ...section.settings[device], [key]: value } });
    }
  }

  return (
    // This panel's own content (especially Hero's Content tab -- dozens of frame/typography/
    // parallax fields) can be taller than the viewport. This div is a direct CSS Grid item (the
    // grid row is shared with the Canvas and the component library, defined one level up in
    // page-builder-shell.tsx) -- a grid item's default min-height is its content's natural height,
    // not 0, so without `overflow-y-auto` *on this element itself* (not a nested child -- tried
    // that first, confirmed live it does NOT prevent the row from inflating, since the automatic
    // min-height:0 reduction only applies to the item the grid container directly sizes against)
    // a tall panel silently stretches the shared row past the outer shell's `h-screen
    // overflow-hidden` boundary. The Canvas's own `h-full` then resolves against that inflated row
    // instead of the real viewport-bounded height, permanently trapping a chunk of canvas content
    // that no scroll gesture (on the canvas OR this panel) can ever bring into view -- confirmed
    // live: selecting Hero made the canvas silently stop scrolling partway through the page, unable
    // to reach the Contact Form section. `overflow-y-auto` right here is the actual fix; it also
    // makes this panel's own long forms independently scrollable instead of silently clipped.
    <div className="flex h-full flex-col overflow-y-auto border-s border-neutral-800 bg-neutral-950">
      <Tabs
        items={[
          {
            key: "content",
            label: "Content",
            content: (
              <div className="space-y-3 p-3">
                <SegmentedControl
                  value={editorLocale}
                  onChange={onLocaleChange}
                  options={[
                    { value: "en", label: "English" },
                    { value: "ar", label: "العربية" },
                  ]}
                />
                <block.Edit data={data} locale={editorLocale} onChange={(next: unknown) => onUpdateData(editorLocale, next)} />
              </div>
            ),
          },
          {
            key: "style",
            label: "Style",
            content: (
              <div className="space-y-3 p-3">
                <p className="rounded-md bg-neutral-900 px-2 py-1.5 text-[11px] text-neutral-500">
                  Editing <span className="font-medium text-neutral-300">{device}</span> {device !== "desktop" ? "overrides" : "(base)"}
                </p>
                <SelectField label="Padding" value={resolved.paddingY} onChange={(v) => updateToken("paddingY", v)} options={PADDING_OPTIONS.map((o) => ({ value: o, label: o }))} />
                <SelectField label="Margin" value={resolved.marginY} onChange={(v) => updateToken("marginY", v)} options={MARGIN_OPTIONS.map((o) => ({ value: o, label: o }))} />
                <SelectField label="Alignment" value={resolved.align} onChange={(v) => updateToken("align", v)} options={ALIGN_OPTIONS.map((o) => ({ value: o, label: o }))} />
                {block.supportsColumns ? (
                  <SelectField label="Columns" value={resolved.columns} onChange={(v) => updateToken("columns", v)} options={COLUMNS_OPTIONS.map((o) => ({ value: o, label: o }))} />
                ) : null}
                <SelectField label="Heading size" value={resolved.headingSize} onChange={(v) => updateToken("headingSize", v)} options={HEADING_SIZE_OPTIONS.map((o) => ({ value: o, label: o }))} />
                <SelectField label="Body size" value={resolved.bodySize} onChange={(v) => updateToken("bodySize", v)} options={BODY_SIZE_OPTIONS.map((o) => ({ value: o, label: o }))} />
                <CheckboxField label={`Visible on ${device}`} checked={resolved.visible} onChange={(v) => updateToken("visible", v)} />
                <div className="mt-4 border-t border-neutral-800 pt-3">
                  <SelectField
                    label="Background"
                    value={section.settings.background}
                    onChange={(background) => onUpdateSettings({ ...section.settings, background })}
                    options={BACKGROUND_OPTIONS.map((o) => ({ value: o, label: o }))}
                  />
                </div>
                <SelectField
                  label="Entrance animation"
                  value={section.settings.animation}
                  onChange={(animation) => onUpdateSettings({ ...section.settings, animation })}
                  options={[
                    { value: "none", label: "None" },
                    { value: "fade-up", label: "Fade up" },
                    { value: "fade-down", label: "Fade down" },
                    { value: "fade-in", label: "Fade in" },
                    { value: "zoom-in", label: "Zoom in" },
                    { value: "scale", label: "Scale" },
                    { value: "slide-start", label: "Slide in (start)" },
                    { value: "slide-end", label: "Slide in (end)" },
                    { value: "parallax", label: "Parallax" },
                  ]}
                />
              </div>
            ),
          },
          {
            key: "advanced",
            label: "Advanced",
            content: (
              <div className="space-y-3 p-3">
                <p className="text-xs text-neutral-500">Block type: {block.label}</p>
                <p className="text-xs text-neutral-600">Section ID: {section.id}</p>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
