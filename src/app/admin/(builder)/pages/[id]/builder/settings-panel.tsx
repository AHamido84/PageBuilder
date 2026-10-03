"use client";

import { getBlock } from "@/lib/page-builder/registry";
import type {
  AlignToken,
  BuilderSection,
  Breakpoint,
  EditorLocale,
  SectionAdvancedSettings,
  SectionBorderSettings,
  SectionButtonSettings,
  SectionSettings,
  SectionTypographySettings,
  StyleTokens,
} from "@/lib/page-builder/types";
import { defaultStyleTokens, defaultBackgroundImageSettings, sanitizeAdvancedToken, defaultSectionElementMotion, defaultSectionHoverSettings } from "@/lib/page-builder/types";
import type { ElementMotionToken } from "@/lib/page-builder/types";

// PHASE 9 element-level animation choices (CSS keyframes in globals.css).
const ELEMENT_MOTION_OPTIONS: { value: ElementMotionToken; label: string }[] = [
  { value: "none", label: "None" },
  { value: "fade", label: "Fade" },
  { value: "fade-up", label: "Fade up" },
  { value: "fade-down", label: "Fade down" },
  { value: "fade-start", label: "Fade from start (RTL-aware)" },
  { value: "fade-end", label: "Fade from end (RTL-aware)" },
  { value: "scale", label: "Scale" },
  { value: "blur", label: "Blur reveal" },
  { value: "reveal", label: "Reveal wipe" },
];
const ELEMENT_MOTION_LABELS = { heading: "Headings", text: "Text", image: "Images", button: "Buttons", card: "Cards" } as const;
import {
  ALIGN_OPTIONS,
  ANIMATION_INTENSITY_OPTIONS,
  ANIMATION_TRIGGER_OPTIONS,
  BACKGROUND_ATTACHMENT_OPTIONS,
  BACKGROUND_OPTIONS,
  BACKGROUND_REPEAT_OPTIONS,
  BACKGROUND_SIZE_OPTIONS,
  BODY_SIZE_OPTIONS,
  BORDER_COLOR_OPTIONS,
  BORDER_RADIUS_OPTIONS,
  BORDER_STYLE_OPTIONS,
  BORDER_WIDTH_OPTIONS,
  BUTTON_PADDING_OPTIONS,
  BUTTON_RADIUS_OPTIONS,
  BUTTON_SHADOW_OPTIONS,
  COLUMNS_OPTIONS,
  CONTAINER_WIDTH_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  GAP_OPTIONS,
  HEADING_SIZE_OPTIONS,
  HEIGHT_OPTIONS,
  LINE_HEIGHT_OPTIONS,
  MARGIN_OPTIONS,
  OVERLAY_OPTIONS,
  PADDING_OPTIONS,
  SHADOW_OPTIONS,
  TEXT_COLOR_OPTIONS,
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

function labelize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, " ");
}

interface Props {
  section: BuilderSection;
  device: Breakpoint;
  onDeviceChange: (device: Breakpoint) => void;
  locale: EditorLocale;
  onLocaleChange: (locale: EditorLocale) => void;
  onUpdateData: (locale: "en" | "ar", data: unknown) => void;
  /** Updates ONLY the given locale's style settings -- AR and EN are fully independent. */
  onUpdateSettings: (locale: EditorLocale, next: SectionSettings) => void;
}

export function SettingsPanel({ section, device, onDeviceChange, locale: editorLocale, onLocaleChange, onUpdateData, onUpdateSettings }: Props) {
  const block = getBlock(section.type);
  if (!block) return <div className="p-4 text-sm text-neutral-500">Unknown block type.</div>;

  const data = editorLocale === "ar" ? section.dataAr : section.dataEn;
  // Everything below reads/writes ONLY section.settings[editorLocale] -- AR and EN each store
  // and resolve their own independent padding/margin/alignment/columns/sizing/background/border/
  // typography/buttons/animation. Never falls through to the other locale's value. See
  // LocaleSectionSettings in types.ts for the root-cause fix this replaced (a single settings
  // object shared by both) -- every Phase 9 tab below inherits that same independence for free,
  // which is why "Arabic"/"English" isn't a 12th tab of its own: switching this control already
  // scopes every tab (Content through Advanced) to one language, with zero cross-contamination.
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

  function updateSetting<K extends keyof SectionSettings>(key: K, value: SectionSettings[K]) {
    onUpdateSettings(editorLocale, { ...localeSettings, [key]: value });
  }

  function updateBorder<K extends keyof SectionBorderSettings>(key: K, value: SectionBorderSettings[K]) {
    updateSetting("border", { ...localeSettings.border, [key]: value });
  }

  function updateTypography<K extends keyof SectionTypographySettings>(key: K, value: SectionTypographySettings[K]) {
    updateSetting("typography", { ...localeSettings.typography, [key]: value });
  }

  function updateButtons<K extends keyof SectionButtonSettings>(key: K, value: SectionButtonSettings[K]) {
    updateSetting("buttons", { ...localeSettings.buttons, [key]: value });
  }

  function updateAdvanced<K extends keyof SectionAdvancedSettings>(key: K, value: SectionAdvancedSettings[K]) {
    updateSetting("advanced", { ...localeSettings.advanced, [key]: value });
  }

  // Background image is not per-breakpoint (unlike padding/margin/etc. above) -- it has its own
  // explicit desktop/mobile image pair instead, so it's read/written straight off localeSettings
  // regardless of the `device` preview toggle. Defends against pre-fix rows saved before this field
  // existed (defaultBackgroundImageSettings() fallback), same pattern as `resolved` above.
  const bg = localeSettings.backgroundImage ?? defaultBackgroundImageSettings();
  function updateBg<K extends keyof typeof bg>(key: K, value: (typeof bg)[K]) {
    updateSetting("backgroundImage", { ...bg, [key]: value });
  }

  const deviceLabel = device === "desktop" ? "Desktop" : device === "tablet" ? "Tablet" : "Mobile";

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
          Content) so it's unmistakable that EVERY tab below (Content through Advanced) is currently
          scoped to one language. Phase 9's brief lists "Arabic"/"English" among the panel's tabs;
          this is that requirement's actual UI, kept as one switcher rather than two more items in
          the tab strip below -- a tab strip is a single-select control, so a literal "Arabic" tab
          could never be open AT THE SAME TIME as e.g. "Style", making it impossible to edit Arabic
          Style. This control already fully satisfies "Arabic settings and English settings must be
          independent" (see LocaleSectionSettings, types.ts) for every tab, content and style alike. */}
      <div className="space-y-1.5 border-b border-neutral-800 p-3">
        <SegmentedControl value={editorLocale} onChange={onLocaleChange} options={[{ value: "en", label: "English" }, { value: "ar", label: "العربية" }]} />
        {/* PHASE 10: settings are per language by design; this copies the other language's layout/style/
            animation/background in one step (content text is untouched). Undoable like any edit. */}
        <button
          type="button"
          onClick={() => onUpdateSettings(editorLocale, structuredClone(section.settings[editorLocale === "ar" ? "en" : "ar"]))}
          className="text-[11px] text-neutral-400 underline-offset-2 hover:text-neutral-100 hover:underline"
          title="Copies layout, style, typography, buttons, animation, background and advanced settings. Content text is not copied. Undo with Ctrl+Z."
        >
          {editorLocale === "ar" ? "Copy design settings from English" : "Copy design settings from العربية"}
        </button>
        <p className="text-[11px] text-neutral-500">
          Editing every tab below for <span className="font-medium text-neutral-300">{editorLocale === "ar" ? "العربية" : "English"}</span> only — the other
          language is unaffected.
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
            key: "media",
            label: "Media",
            content: (
              <div className="space-y-3 p-3">
                <p className="rounded-md bg-neutral-900 px-2 py-1.5 text-[11px] text-neutral-500">
                  Section background media, behind this block&apos;s own content — a different layer from any image/video field inside the block&apos;s own
                  Content tab.
                </p>
                <MediaPickerControlled
                  label="Desktop image"
                  uploadFolderName="Backgrounds"
                  mediaId={bg.image?.id ?? ""}
                  previewUrl={bg.image?.url}
                  onChange={(id, url) => updateBg("image", id ? { id, url } : null)}
                />
                {bg.image ? (
                  <>
                    <MediaPickerControlled
                      label="Mobile image (optional — falls back to desktop)"
                      uploadFolderName="Backgrounds"
                      mediaId={bg.mobileImage?.id ?? ""}
                      previewUrl={bg.mobileImage?.url}
                      onChange={(id, url) => updateBg("mobileImage", id ? { id, url } : null)}
                    />
                    <SelectField
                      label="Fit"
                      value={bg.size}
                      onChange={(size) => updateBg("size", size)}
                      options={BACKGROUND_SIZE_OPTIONS.map((o) => ({ value: o, label: labelize(o) }))}
                    />
                    {bg.size === "custom" ? (
                      <TextField label="Custom size (CSS)" value={bg.customSize} onChange={(customSize) => updateBg("customSize", customSize)} placeholder="e.g. 400px auto" />
                    ) : null}
                    <div className="grid grid-cols-2 gap-2">
                      <NumberField label="Focal point X (%)" value={bg.positionX} min={0} max={100} onChange={(positionX) => updateBg("positionX", positionX)} />
                      <NumberField label="Focal point Y (%)" value={bg.positionY} min={0} max={100} onChange={(positionY) => updateBg("positionY", positionY)} />
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
                      label="Image motion (desktop only)"
                      value={bg.motion ?? "none"}
                      onChange={(motion) => updateBg("motion", motion)}
                      options={[
                        { value: "none", label: "None" },
                        { value: "slow-zoom", label: "Slow zoom" },
                        { value: "ken-burns", label: "Ken Burns — zoom + drift" },
                      ]}
                    />
                    <SelectField
                      label="Overlay"
                      value={bg.overlay}
                      onChange={(overlay) => updateBg("overlay", overlay)}
                      options={OVERLAY_OPTIONS.map((o) => ({ value: o, label: labelize(o) }))}
                    />
                    {bg.overlay !== "none" ? (
                      <div className="grid grid-cols-2 gap-2">
                        {bg.overlay === "custom" ? (
                          <TextField label="Overlay color" value={bg.overlayColor} onChange={(overlayColor) => updateBg("overlayColor", overlayColor)} placeholder="#18302D" />
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
                    <div className="grid grid-cols-3 gap-2 border-t border-neutral-800 pt-3">
                      <NumberField label="Blur (px)" value={bg.blur} min={0} max={20} onChange={(blur) => updateBg("blur", blur)} />
                      <NumberField label="Brightness (%)" value={bg.brightness} min={50} max={150} onChange={(brightness) => updateBg("brightness", brightness)} />
                      <NumberField label="Contrast (%)" value={bg.contrast} min={50} max={150} onChange={(contrast) => updateBg("contrast", contrast)} />
                    </div>
                    <div className="border-t border-neutral-800 pt-3">
                      <MediaPickerControlled
                        label="Video (optional — plays over the image above, which stays as its poster/fallback)"
                        accept="VIDEO"
                        uploadFolderName="Backgrounds"
                        mediaId={bg.video?.id ?? ""}
                        previewUrl={bg.video?.url}
                        onChange={(id, url) => updateBg("video", id ? { id, url } : null)}
                      />
                    </div>
                  </>
                ) : null}
              </div>
            ),
          },
          {
            key: "layout",
            label: "Layout",
            content: (
              <div className="space-y-3 p-3">
                <p className="rounded-md bg-neutral-900 px-2 py-1.5 text-[11px] text-neutral-500">
                  Editing <span className="font-medium text-neutral-300">{device}</span> {device !== "desktop" ? "overrides" : "(base)"} — switch device from
                  the Responsive tab or the toolbar above the canvas.
                </p>
                <SelectField
                  label="Container width"
                  value={localeSettings.containerWidth}
                  onChange={(containerWidth) => updateSetting("containerWidth", containerWidth)}
                  options={CONTAINER_WIDTH_OPTIONS.map((o) => ({
                    value: o,
                    label: o === "default" ? "Default (block decides)" : o === "full" ? "Full width" : "Contained",
                  }))}
                />
                <SelectField
                  label="Height"
                  value={resolved.height ?? "auto"}
                  onChange={(v) => updateToken("height", v)}
                  options={HEIGHT_OPTIONS.map((o) => ({ value: o, label: o === "auto" ? "Auto (content height)" : o === "screen" ? "Full screen" : o }))}
                />
                {block.supportsColumns ? (
                  <SelectField label="Columns" value={resolved.columns} onChange={(v) => updateToken("columns", v)} options={COLUMNS_OPTIONS.map((o) => ({ value: o, label: o }))} />
                ) : null}
                <SelectField
                  label="Gap"
                  value={localeSettings.gap}
                  onChange={(gap) => updateSetting("gap", gap)}
                  options={GAP_OPTIONS.map((o) => ({ value: o, label: o === "default" ? "Default (block decides)" : labelize(o) }))}
                />
                <SelectField
                  label="Alignment"
                  value={resolved.align}
                  onChange={(v) => updateToken("align", v)}
                  options={ALIGN_OPTIONS.map((o) => ({ value: o, label: alignOptionLabel(o, editorLocale) }))}
                />
                <SelectField label="Padding" value={resolved.paddingY} onChange={(v) => updateToken("paddingY", v)} options={PADDING_OPTIONS.map((o) => ({ value: o, label: o }))} />
                <SelectField label="Margin" value={resolved.marginY} onChange={(v) => updateToken("marginY", v)} options={MARGIN_OPTIONS.map((o) => ({ value: o, label: o }))} />
              </div>
            ),
          },
          {
            key: "style",
            label: "Style",
            content: (
              <div className="space-y-3 p-3">
                <SelectField
                  label="Background color"
                  value={localeSettings.background}
                  onChange={(background) => updateSetting("background", background)}
                  options={BACKGROUND_OPTIONS.map((o) => ({ value: o, label: o }))}
                />
                <SelectField
                  label="Border radius"
                  value={localeSettings.borderRadius}
                  onChange={(borderRadius) => updateSetting("borderRadius", borderRadius)}
                  options={BORDER_RADIUS_OPTIONS.map((o) => ({ value: o, label: o }))}
                />
                <SelectField
                  label="Shadow"
                  value={localeSettings.shadow}
                  onChange={(shadow) => updateSetting("shadow", shadow)}
                  options={SHADOW_OPTIONS.map((o) => ({ value: o, label: o === "none" ? "None" : o.toUpperCase() }))}
                />
                <div className="space-y-3 border-t border-neutral-800 pt-3">
                  <p className="text-xs font-medium text-neutral-300">Border</p>
                  <SelectField
                    label="Width"
                    value={localeSettings.border.width}
                    onChange={(width) => updateBorder("width", width)}
                    options={BORDER_WIDTH_OPTIONS.map((o) => ({ value: o, label: labelize(o) }))}
                  />
                  {localeSettings.border.width !== "none" ? (
                    <>
                      <SelectField
                        label="Style"
                        value={localeSettings.border.style}
                        onChange={(style) => updateBorder("style", style)}
                        options={BORDER_STYLE_OPTIONS.map((o) => ({ value: o, label: labelize(o) }))}
                      />
                      <SelectField
                        label="Color"
                        value={localeSettings.border.color}
                        onChange={(color) => updateBorder("color", color)}
                        options={BORDER_COLOR_OPTIONS.map((o) => ({ value: o, label: labelize(o) }))}
                      />
                      {localeSettings.border.color === "custom" ? (
                        <TextField label="Custom color" value={localeSettings.border.customColor} onChange={(customColor) => updateBorder("customColor", customColor)} placeholder="#18302D" />
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
            ),
          },
          {
            key: "typography",
            label: "Typography",
            content: (
              <div className="space-y-3 p-3">
                <p className="rounded-md bg-neutral-900 px-2 py-1.5 text-[11px] text-neutral-500">
                  Alignment lives on the Layout tab (one field, not duplicated here). Weight/Color/Line height apply to this section&apos;s own text via
                  inheritance — a block that already sets its own explicit text color/weight is unaffected, same convention as Alignment.
                </p>
                <SelectField label="Heading size" value={resolved.headingSize} onChange={(v) => updateToken("headingSize", v)} options={HEADING_SIZE_OPTIONS.map((o) => ({ value: o, label: o }))} />
                <SelectField label="Body size" value={resolved.bodySize} onChange={(v) => updateToken("bodySize", v)} options={BODY_SIZE_OPTIONS.map((o) => ({ value: o, label: o }))} />
                <SelectField
                  label="Weight"
                  value={localeSettings.typography.weight}
                  onChange={(weight) => updateTypography("weight", weight)}
                  options={FONT_WEIGHT_OPTIONS.map((o) => ({ value: o, label: o === "inherit" ? "Inherit (block decides)" : labelize(o) }))}
                />
                <SelectField
                  label="Color"
                  value={localeSettings.typography.color}
                  onChange={(color) => updateTypography("color", color)}
                  options={TEXT_COLOR_OPTIONS.map((o) => ({ value: o, label: o === "inherit" ? "Inherit (block decides)" : labelize(o) }))}
                />
                <SelectField
                  label="Line height"
                  value={localeSettings.typography.lineHeight}
                  onChange={(lineHeight) => updateTypography("lineHeight", lineHeight)}
                  options={LINE_HEIGHT_OPTIONS.map((o) => ({ value: o, label: o === "inherit" ? "Inherit (block decides)" : labelize(o) }))}
                />
              </div>
            ),
          },
          {
            key: "buttons",
            label: "Buttons",
            content: (
              <div className="space-y-3 p-3">
                <p className="rounded-md bg-neutral-900 px-2 py-1.5 text-[11px] text-neutral-500">
                  Overrides the site-wide Buttons defaults (Admin → Settings → Appearance) for every button inside this section only. &quot;Inherit&quot;
                  (the default) leaves the global default untouched.
                </p>
                <SelectField
                  label="Radius"
                  value={localeSettings.buttons.radius}
                  onChange={(radius) => updateButtons("radius", radius)}
                  options={BUTTON_RADIUS_OPTIONS.map((o) => ({ value: o, label: o === "inherit" ? "Inherit (global default)" : o === "full" ? "Full (pill)" : labelize(o) }))}
                />
                <SelectField
                  label="Shadow"
                  value={localeSettings.buttons.shadow}
                  onChange={(shadow) => updateButtons("shadow", shadow)}
                  options={BUTTON_SHADOW_OPTIONS.map((o) => ({ value: o, label: o === "inherit" ? "Inherit (global default)" : labelize(o) }))}
                />
                <SelectField
                  label="Padding"
                  value={localeSettings.buttons.paddingScale}
                  onChange={(paddingScale) => updateButtons("paddingScale", paddingScale)}
                  options={BUTTON_PADDING_OPTIONS.map((o) => ({ value: o, label: o === "inherit" ? "Inherit (global default)" : labelize(o) }))}
                />
                <SelectField
                  label="Icon"
                  value={localeSettings.buttons.icon}
                  onChange={(icon) => updateButtons("icon", icon)}
                  options={[
                    { value: "inherit", label: "Inherit (global default)" },
                    { value: "show", label: "Always show" },
                    { value: "hide", label: "Always hide" },
                  ]}
                />
              </div>
            ),
          },
          {
            key: "animation",
            label: "Animation",
            content: (
              <div className="space-y-3 p-3">
                <SelectField
                  label="Animation"
                  value={localeSettings.animation}
                  onChange={(animation) => updateSetting("animation", animation)}
                  options={[
                    { value: "inherit", label: "Inherit from global default" },
                    { value: "none", label: "None" },
                    { value: "fade-up", label: "Fade up" },
                    { value: "fade-down", label: "Fade down" },
                    { value: "fade-in", label: "Fade in" },
                    { value: "zoom-in", label: "Zoom in" },
                    { value: "scale", label: "Scale" },
                    { value: "slide-start", label: "Slide in (start — reading direction, RTL-aware)" },
                    { value: "slide-end", label: "Slide in (end — reading direction, RTL-aware)" },
                    { value: "fade-left", label: "Fade in from left (physical, same in AR/EN)" },
                    { value: "fade-right", label: "Fade in from right (physical, same in AR/EN)" },
                    { value: "reveal", label: "Reveal — bottom-up wipe" },
                    { value: "blur-reveal", label: "Blur reveal (plain fade on phones)" },
                    { value: "parallax", label: "Parallax" },
                  ]}
                />
                {localeSettings.animation !== "none" ? (
                  <>
                    <SelectField
                      label="Trigger"
                      value={localeSettings.animationTrigger}
                      onChange={(animationTrigger) => updateSetting("animationTrigger", animationTrigger)}
                      options={ANIMATION_TRIGGER_OPTIONS.map((o) => ({
                        value: o,
                        label: o === "onScroll" ? "On scroll into view (once)" : o === "onScrollRepeat" ? "Every time it scrolls into view" : "On page load",
                      }))}
                    />
                    <SelectField
                      label="Easing"
                      value={localeSettings.animationEasing ?? "premium"}
                      onChange={(animationEasing) => updateSetting("animationEasing", animationEasing)}
                      options={[
                        { value: "premium", label: "Premium (default)" },
                        { value: "smooth", label: "Smooth" },
                        { value: "out", label: "Ease out" },
                        { value: "in-out", label: "Ease in-out" },
                        { value: "linear", label: "Linear" },
                        { value: "spring", label: "Soft spring" },
                      ]}
                    />
                    <SelectField
                      label="Intensity"
                      value={localeSettings.animationIntensity}
                      onChange={(animationIntensity) => updateSetting("animationIntensity", animationIntensity)}
                      options={ANIMATION_INTENSITY_OPTIONS.map((o) => ({ value: o, label: labelize(o) }))}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <NumberField
                        label="Duration (ms, blank = default)"
                        value={localeSettings.animationDurationMs ?? 0}
                        min={0}
                        max={5000}
                        onChange={(v) => updateSetting("animationDurationMs", v > 0 ? v : null)}
                      />
                      <NumberField label="Delay (ms)" value={localeSettings.animationDelayMs} min={0} max={3000} onChange={(v) => updateSetting("animationDelayMs", v)} />
                    </div>
                  </>
                ) : null}

                <div className="space-y-2 border-t border-neutral-800 pt-3">
                  <p className="text-xs font-medium text-neutral-300">Element animations</p>
                  <p className="text-[11px] leading-snug text-neutral-500">
                    Animate the headings, text, images, buttons and cards inside this section independently, as they scroll into view. CSS-only;
                    browsers without scroll-timeline support (and visitors who prefer reduced motion) simply see the content.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(["heading", "text", "image", "button", "card"] as const).map((key) => (
                      <SelectField
                        key={key}
                        label={ELEMENT_MOTION_LABELS[key]}
                        value={localeSettings.elementMotion?.[key] ?? "none"}
                        onChange={(value) => updateSetting("elementMotion", { ...defaultSectionElementMotion(localeSettings.elementMotion), [key]: value })}
                        options={ELEMENT_MOTION_OPTIONS}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2 border-t border-neutral-800 pt-3">
                  <p className="text-xs font-medium text-neutral-300">Hover effects</p>
                  <CheckboxField
                    label="Image zoom"
                    checked={localeSettings.hover?.imageZoom ?? false}
                    onChange={(imageZoom) => updateSetting("hover", { ...defaultSectionHoverSettings(localeSettings.hover), imageZoom })}
                  />
                  <CheckboxField
                    label="Card lift"
                    checked={localeSettings.hover?.cardLift ?? false}
                    onChange={(cardLift) => updateSetting("hover", { ...defaultSectionHoverSettings(localeSettings.hover), cardLift })}
                  />
                  <CheckboxField
                    label="Overlay reveal on images"
                    checked={localeSettings.hover?.overlayReveal ?? false}
                    onChange={(overlayReveal) => updateSetting("hover", { ...defaultSectionHoverSettings(localeSettings.hover), overlayReveal })}
                  />
                  <SelectField
                    label="Button hover"
                    value={localeSettings.hover?.button ?? "none"}
                    onChange={(button) => updateSetting("hover", { ...defaultSectionHoverSettings(localeSettings.hover), button })}
                    options={[
                      { value: "none", label: "Default" },
                      { value: "lift", label: "Lift" },
                      { value: "shine", label: "Shine sweep" },
                      { value: "arrow", label: "Nudge icon" },
                    ]}
                  />
                </div>
              </div>
            ),
          },
          {
            key: "responsive",
            label: "Responsive",
            content: (
              <div className="space-y-3 p-3">
                <p className="text-xs font-medium text-neutral-300">Preview / edit device</p>
                <SegmentedControl
                  value={device}
                  onChange={onDeviceChange}
                  options={[
                    { value: "desktop", label: "Desktop" },
                    { value: "tablet", label: "Tablet" },
                    { value: "mobile", label: "Mobile" },
                  ]}
                />
                <p className="text-[11px] text-neutral-500">
                  Layout and Typography&apos;s Padding/Margin/Alignment/Columns/Height/Heading size/Body size all respect whichever device is selected here —
                  switch device, then go back to those tabs to set a {deviceLabel.toLowerCase()}-specific override. A blank/unset override falls back to
                  Desktop&apos;s value.
                </p>
                <div className="border-t border-neutral-800 pt-3">
                  <CheckboxField label={`Visible on ${deviceLabel.toLowerCase()}`} checked={resolved.visible} onChange={(v) => updateToken("visible", v)} />
                </div>
              </div>
            ),
          },
          {
            key: "advanced",
            label: "Advanced",
            content: (
              <div className="space-y-3 p-3">
                <TextField
                  label="Custom CSS class"
                  value={localeSettings.advanced.customClass}
                  onChange={(v) => updateAdvanced("customClass", sanitizeAdvancedToken(v, true))}
                  placeholder="e.g. my-custom-section"
                />
                <TextField
                  label="Anchor ID (for #links)"
                  value={localeSettings.advanced.anchorId}
                  onChange={(v) => updateAdvanced("anchorId", sanitizeAdvancedToken(v, false))}
                  placeholder="e.g. contact"
                />
                <p className="text-[11px] text-neutral-500">
                  Letters, numbers, hyphens and underscores only (spaces allowed in the class field) — anything else is stripped automatically.
                </p>
                <div className="border-t border-neutral-800 pt-3">
                  <p className="text-xs text-neutral-500">Block type: {block.label}</p>
                  <p className="text-xs text-neutral-600">Section ID: {section.id}</p>
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
