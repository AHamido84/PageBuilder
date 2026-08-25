"use client";

import { getBlock } from "@/lib/page-builder/registry";
import type { AlignToken, BuilderSection, Breakpoint, EditorLocale, SectionSettings, StyleTokens } from "@/lib/page-builder/types";
import { defaultStyleTokens, defaultBackgroundImageSettings } from "@/lib/page-builder/types";
import {
  ALIGN_OPTIONS,
  BACKGROUND_ATTACHMENT_OPTIONS,
  BACKGROUND_OPTIONS,
  BACKGROUND_REPEAT_OPTIONS,
  BACKGROUND_SIZE_OPTIONS,
  BODY_SIZE_OPTIONS,
  COLUMNS_OPTIONS,
  HEADING_SIZE_OPTIONS,
  MARGIN_OPTIONS,
  OVERLAY_OPTIONS,
  PADDING_OPTIONS,
} from "@/lib/page-builder/style-tokens";
import { SelectField, CheckboxField, NumberField, TextField } from "@/components/admin/ui/field";
import { MediaPickerControlled } from "@/components/admin/ui/media-picker-field";
import { SegmentedControl } from "@/components/admin/ui/segmented-control";
import { Tabs } from "@/components/admin/ui/tabs";

/** `AlignToken`'s stored values ("left"/"right") resolve to LOGICAL CSS (text-start/text-end, see
 * style-tokens.ts) so the same value renders on opposite physical sides in EN vs AR. The dropdown
 * label says so explicitly -- an editor picking "Start" for Arabic content should never have to
 * guess that it renders on the right, not the left, the way a plain "Left" label would wrongly imply. */
function alignOptionLabel(token: AlignToken, editorLocale: EditorLocale): string {
  if (token === "center") return "Center";
  const isStart = token === "left";
  const physicalSide = editorLocale === "ar" ? (isStart ? "right" : "left") : isStart ? "left" : "right";
  return `${isStart ? "Start" : "End"} (${physicalSide})`;
}

interface Props {
  section: BuilderSection;
  device: Breakpoint;
  locale: EditorLocale;
  onLocaleChange: (locale: EditorLocale) => void;
  onUpdateData: (locale: "en" | "ar", data: unknown) => void;
  /** Updates ONLY the given locale's style settings -- AR and EN are fully independent. */
  onUpdateSettings: (locale: EditorLocale, next: SectionSettings) => void;
}

export function SettingsPanel({ section, device, locale: editorLocale, onLocaleChange, onUpdateData, onUpdateSettings }: Props) {
  const block = getBlock(section.type);
  if (!block) return <div className="p-4 text-sm text-neutral-500">Unknown block type.</div>;

  const data = editorLocale === "ar" ? section.dataAr : section.dataEn;
  // Everything below reads/writes ONLY section.settings[editorLocale] -- AR and EN each store
  // and resolve their own independent padding/margin/alignment/columns/sizing/background/
  // animation. Never falls through to the other locale's value. See LocaleSectionSettings in
  // types.ts for the root-cause fix this replaced (a single settings object shared by both).
  const localeSettings = section.settings[editorLocale];
  const breakpointTokens: Partial<StyleTokens> = device === "desktop" ? localeSettings.desktop : device === "tablet" ? localeSettings.tablet : localeSettings.mobile;
  const resolved: StyleTokens = { ...defaultStyleTokens(), ...localeSettings.desktop, ...(device !== "desktop" ? breakpointTokens : {}) };

  function updateToken<K extends keyof StyleTokens>(key: K, value: StyleTokens[K]) {
    if (device === "desktop") {
      onUpdateSettings(editorLocale, { ...localeSettings, desktop: { ...localeSettings.desktop, [key]: value } });
    } else {
      onUpdateSettings(editorLocale, { ...localeSettings, [device]: { ...localeSettings[device], [key]: value } });
    }
  }

  // Background image is not per-breakpoint (unlike padding/margin/etc. above) -- it has its own
  // explicit desktop/mobile image pair instead, so it's read/written straight off localeSettings
  // regardless of the `device` preview toggle. Defends against pre-fix rows saved before this field
  // existed (defaultBackgroundImageSettings() fallback), same pattern as `resolved` above.
  const bg = localeSettings.backgroundImage ?? defaultBackgroundImageSettings();
  function updateBg<K extends keyof typeof bg>(key: K, value: (typeof bg)[K]) {
    onUpdateSettings(editorLocale, { ...localeSettings, backgroundImage: { ...bg, [key]: value } });
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
      {/* Persistent, always-visible language switcher -- lives above the tabs (not just inside
          Content) so it's unmistakable that BOTH the Content and Style tabs are currently scoped
          to one language. Content and Style panels below read/write ONLY this locale's data and
          settings; switching it changes what both tabs show, never what the other locale stores. */}
      <div className="space-y-1.5 border-b border-neutral-800 p-3">
        <SegmentedControl value={editorLocale} onChange={onLocaleChange} options={[{ value: "en", label: "English" }, { value: "ar", label: "العربية" }]} />
        <p className="text-[11px] text-neutral-500">
          Editing content <span className="font-medium text-neutral-300">and</span> style for{" "}
          <span className="font-medium text-neutral-300">{editorLocale === "ar" ? "العربية" : "English"}</span> only — the other language is unaffected.
        </p>
      </div>
      <Tabs
        items={[
          {
            key: "content",
            label: "Content",
            content: (
              <div className="space-y-3 p-3">
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
                <SelectField
                  label="Alignment"
                  value={resolved.align}
                  onChange={(v) => updateToken("align", v)}
                  options={ALIGN_OPTIONS.map((o) => ({ value: o, label: alignOptionLabel(o, editorLocale) }))}
                />
                {block.supportsColumns ? (
                  <SelectField label="Columns" value={resolved.columns} onChange={(v) => updateToken("columns", v)} options={COLUMNS_OPTIONS.map((o) => ({ value: o, label: o }))} />
                ) : null}
                <SelectField label="Heading size" value={resolved.headingSize} onChange={(v) => updateToken("headingSize", v)} options={HEADING_SIZE_OPTIONS.map((o) => ({ value: o, label: o }))} />
                <SelectField label="Body size" value={resolved.bodySize} onChange={(v) => updateToken("bodySize", v)} options={BODY_SIZE_OPTIONS.map((o) => ({ value: o, label: o }))} />
                <CheckboxField label={`Visible on ${device}`} checked={resolved.visible} onChange={(v) => updateToken("visible", v)} />
                <div className="mt-4 border-t border-neutral-800 pt-3">
                  <SelectField
                    label="Background color"
                    value={localeSettings.background}
                    onChange={(background) => onUpdateSettings(editorLocale, { ...localeSettings, background })}
                    options={BACKGROUND_OPTIONS.map((o) => ({ value: o, label: o }))}
                  />
                </div>
                <div className="space-y-3 border-t border-neutral-800 pt-3">
                  <p className="text-xs font-medium text-neutral-300">Background image</p>
                  <MediaPickerControlled
                    label="Desktop image"
                    mediaId={bg.image?.id ?? ""}
                    previewUrl={bg.image?.url}
                    onChange={(id, url) => updateBg("image", id ? { id, url } : null)}
                  />
                  {bg.image ? (
                    <>
                      <MediaPickerControlled
                        label="Mobile image (optional — falls back to desktop)"
                        mediaId={bg.mobileImage?.id ?? ""}
                        previewUrl={bg.mobileImage?.url}
                        onChange={(id, url) => updateBg("mobileImage", id ? { id, url } : null)}
                      />
                      <SelectField
                        label="Size"
                        value={bg.size}
                        onChange={(size) => updateBg("size", size)}
                        options={BACKGROUND_SIZE_OPTIONS.map((o) => ({ value: o, label: o }))}
                      />
                      {bg.size === "custom" ? (
                        <TextField label="Custom size (CSS)" value={bg.customSize} onChange={(customSize) => updateBg("customSize", customSize)} placeholder="e.g. 400px auto" />
                      ) : null}
                      <div className="grid grid-cols-2 gap-2">
                        <NumberField label="Position X (%)" value={bg.positionX} min={0} max={100} onChange={(positionX) => updateBg("positionX", positionX)} />
                        <NumberField label="Position Y (%)" value={bg.positionY} min={0} max={100} onChange={(positionY) => updateBg("positionY", positionY)} />
                      </div>
                      <SelectField
                        label="Repeat"
                        value={bg.repeat}
                        onChange={(repeat) => updateBg("repeat", repeat)}
                        options={BACKGROUND_REPEAT_OPTIONS.map((o) => ({ value: o, label: o }))}
                      />
                      <SelectField
                        label="Attachment"
                        value={bg.attachment}
                        onChange={(attachment) => updateBg("attachment", attachment)}
                        options={BACKGROUND_ATTACHMENT_OPTIONS.map((o) => ({ value: o, label: o === "fixed" ? "Fixed (parallax)" : "Scroll" }))}
                      />
                      <SelectField
                        label="Overlay"
                        value={bg.overlay}
                        onChange={(overlay) => updateBg("overlay", overlay)}
                        options={OVERLAY_OPTIONS.map((o) => ({ value: o, label: o }))}
                      />
                      {bg.overlay !== "none" ? (
                        <div className="grid grid-cols-2 gap-2">
                          {bg.overlay === "custom" ? (
                            <TextField label="Overlay color" value={bg.overlayColor} onChange={(overlayColor) => updateBg("overlayColor", overlayColor)} placeholder="#0B1C2C" />
                          ) : null}
                          <NumberField
                            label="Overlay opacity (%)"
                            value={bg.overlayOpacity}
                            min={0}
                            max={100}
                            onChange={(overlayOpacity) => updateBg("overlayOpacity", overlayOpacity)}
                          />
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>
                <SelectField
                  label="Entrance animation"
                  value={localeSettings.animation}
                  onChange={(animation) => onUpdateSettings(editorLocale, { ...localeSettings, animation })}
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
