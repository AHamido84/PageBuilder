"use client";

import Link from "next/link";
import Image from "next/image";
import { TextField, TextareaField, SelectField, NumberField, CheckboxField } from "@/components/admin/ui/field";
import { MediaPickerControlled } from "@/components/admin/ui/media-picker-field";
import { MultiMediaPickerButton, type MediaListItem } from "@/components/admin/ui/media-library-modal";
import { Trash2 } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { KineticText, Stagger, StaggerItem, usePointerParallaxContainer, pointerParallaxStyle } from "@/lib/motion/primitives";
import { RouteLine } from "@/components/site/graphics/route-line";
import { TemperatureIndicator } from "@/components/site/graphics/temperature-indicator";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import { resolveHref } from "../../href";
import { useReferenceData } from "../../reference-data-context";
import type { HeroData, HeroRenderData, HeroResolvedMedia, HeroImagePosition, HeroFramePosition, HeroCompositionData } from "../content-blocks";
import { HeroFrame, HeroMediaMotion, HeroVideoLayer, HeroCtaOverlay, heroButtonVariant, heroImageFitClass, CTA_STYLE_OPTIONS, type HeroFullBleedOptions } from "./hero-shared";
import { HeroFrameShape } from "./hero-frame-shape";
import { HeroDecorativeTypography } from "./hero-decorative-typography";
import { HeroProductComposition } from "./hero-product-composition-render";
import { HeroComposition } from "./hero-3d-composition";
import { FRAME_STYLES, FRAME_STYLE_LABELS, FRAME_BORDER_STYLES, FRAME_GLOWS, FRAME_PRESETS, FRAME_PRESET_LABELS, FRAME_PRESET_BUNDLES } from "./frame-shapes";
import { HeroSlidesEditor } from "./hero-slides-edit";
import { HeroSlideshow } from "./hero-slideshow-render";

/** A gentle route-like wave — the hero's small "journey" accent under the eyebrow, per the brief's rule that every decorative graphic must have conceptual relevance (source → customer movement), not be arbitrary. */
const HERO_ACCENT_PATH = "M2 8 Q 30 1 60 8 T 118 8";

/** Editor-only convenience: choosing a preset position sets canonical focal-point values. Render only ever reads focalX/focalY. */
const POSITION_PRESETS: Record<Exclude<HeroImagePosition, "custom">, { focalX: number; focalY: number }> = {
  center: { focalX: 50, focalY: 50 },
  top: { focalX: 50, focalY: 0 },
  bottom: { focalX: 50, focalY: 100 },
  left: { focalX: 0, focalY: 50 },
  right: { focalX: 100, focalY: 50 },
};

/** Where the frame anchors within its slot when smaller than 100% width/height -- `frameX`/`frameY` then nudge from that anchor. Despite the "left"/"right" option labels, this maps to Tailwind's `justify-start`/`justify-end` on a flex row, which (unlike `imagePosition`'s numeric `object-position` values just above) is inherently direction-relative -- confirmed live on /ar: "Left" correctly anchors to the RTL-start (visually right) side, mirroring like the rest of the split layout, not staying physically left. That's the desired behavior (matches the plan's "frame position uses logical start/end" verification target), just worth knowing this option isn't as literally-physical as its label or `imagePosition`'s convention suggests. */
const FRAME_POSITION_ALIGN: Record<HeroFramePosition, string> = {
  left: "items-center justify-start",
  center: "items-center justify-center",
  right: "items-center justify-end",
  top: "items-start justify-center",
  bottom: "items-end justify-center",
  custom: "items-center justify-center",
};

/** Primary/Secondary/Supporting product pickers for Product Composition mode. Sourced from `useReferenceData().products` -- the same "eager-load the whole small catalog into a plain select" pattern already used by Category/Brand Grid's own reference-data pickers, not a new search component (the real catalog is 23 rows, the same order of magnitude). */
function HeroProductPicker({
  data,
  onChange,
}: {
  data: HeroData & Partial<HeroResolvedMedia>;
  onChange: (next: HeroData & Partial<HeroResolvedMedia>) => void;
}) {
  const { products } = useReferenceData();
  const options = [{ value: "", label: "— None —" }, ...products.map((p) => ({ value: p.id, label: p.label }))];
  return (
    <>
      <SelectField label="Primary product" value={data.primaryProductId} onChange={(primaryProductId) => onChange({ ...data, primaryProductId })} options={options} />
      <SelectField label="Secondary product" value={data.secondaryProductId} onChange={(secondaryProductId) => onChange({ ...data, secondaryProductId })} options={options} />
      <SelectField label="Supporting product" value={data.supportingProductId} onChange={(supportingProductId) => onChange({ ...data, supportingProductId })} options={options} />
      <div className="flex flex-wrap items-center gap-4">
        <CheckboxField label="Products link to their detail page" checked={data.productsClickable} onChange={(productsClickable) => onChange({ ...data, productsClickable })} />
        <CheckboxField label="Show Featured badge" checked={data.showProductBadges} onChange={(showProductBadges) => onChange({ ...data, showProductBadges })} />
      </div>
    </>
  );
}

/** Add/remove list for the composition's product/decorative image arrays -- same interaction shape
 * as HeroSlidesEditor's slide list (bulk-add via MultiMediaPickerButton, remove per-item), just
 * picker rows instead of full slide objects. Locally caches each newly-picked id's URL into
 * `compositionMedia` (mirroring HeroSlidesEditor's own `slideMedia` local-cache pattern) so a
 * thumbnail appears immediately, without waiting on the next resolveHeroData round trip. */
function HeroCompositionImageList({
  label,
  ids,
  max,
  urlMap,
  onChange,
}: {
  label: string;
  ids: string[];
  max: number;
  urlMap: Record<string, string> | undefined;
  onChange: (nextIds: string[], nextUrlMap: Record<string, string>) => void;
}) {
  function addItems(items: MediaListItem[]) {
    const room = max - ids.length;
    const toAdd = items.slice(0, Math.max(0, room));
    if (toAdd.length === 0) return;
    const nextUrlMap = { ...(urlMap ?? {}) };
    for (const item of toAdd) nextUrlMap[item.id] = item.url;
    onChange([...ids, ...toAdd.map((item) => item.id)], nextUrlMap);
  }
  function removeAt(index: number) {
    onChange(ids.filter((_, i) => i !== index), urlMap ?? {});
  }

  return (
    <div>
      <p className="mb-1 text-xs text-neutral-400">
        {label} ({ids.length}/{max})
      </p>
      {ids.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {ids.map((id, i) => (
            <div key={id} className="relative h-16 w-16 overflow-hidden rounded-md border border-neutral-700">
              {urlMap?.[id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={urlMap[id]} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-neutral-800 text-[10px] text-neutral-500">?</div>
              )}
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label="Remove"
                className="absolute right-0.5 top-0.5 rounded-full bg-neutral-950/80 p-0.5 text-neutral-300 hover:text-red-400"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : null}
      {ids.length < max ? <MultiMediaPickerButton label={`Add ${label.toLowerCase()}...`} accept="IMAGE" onConfirm={addItems} /> : null}
    </div>
  );
}

/** "3D Composition" mode's full settings panel, grouped into Content/Animation/Layout/Style --
 * mirrors the request's own grouping. Renders arbitrary Media Library images (unlike
 * HeroProductPicker above, which references real Product rows) via hero-3d-composition.tsx. */
function HeroCompositionEditor({
  data,
  onChange,
}: {
  data: HeroData & Partial<HeroResolvedMedia>;
  onChange: (next: HeroData & Partial<HeroResolvedMedia>) => void;
}) {
  const c = data.composition;
  const media = data.compositionMedia;
  function update(patch: Partial<HeroCompositionData>) {
    onChange({ ...data, composition: { ...c, ...patch } });
  }
  function updateMediaMap(key: "productUrls" | "decorativeUrls", nextMap: Record<string, string>) {
    onChange({
      ...data,
      compositionMedia: {
        backgroundUrl: media?.backgroundUrl,
        mobileBackgroundUrl: media?.mobileBackgroundUrl,
        mainUrl: media?.mainUrl,
        secondaryUrl: media?.secondaryUrl,
        productUrls: media?.productUrls ?? {},
        decorativeUrls: media?.decorativeUrls ?? {},
        [key]: nextMap,
      },
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-md border border-neutral-800 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">3D Composition — Content</p>
        <MediaPickerControlled
          label="Background image"
          accept="IMAGE"
          mediaId={c.backgroundId}
          previewUrl={media?.backgroundUrl}
          onChange={(backgroundId, backgroundUrl) =>
            onChange({ ...data, composition: { ...c, backgroundId }, compositionMedia: { ...media, backgroundUrl, productUrls: media?.productUrls ?? {}, decorativeUrls: media?.decorativeUrls ?? {} } })
          }
        />
        <MediaPickerControlled
          label="Mobile background (optional — falls back to desktop)"
          accept="IMAGE"
          mediaId={c.mobileBackgroundId}
          previewUrl={media?.mobileBackgroundUrl}
          onChange={(mobileBackgroundId, mobileBackgroundUrl) =>
            onChange({ ...data, composition: { ...c, mobileBackgroundId }, compositionMedia: { ...media, mobileBackgroundUrl, productUrls: media?.productUrls ?? {}, decorativeUrls: media?.decorativeUrls ?? {} } })
          }
        />
        <MediaPickerControlled
          label="Main image"
          accept="IMAGE"
          mediaId={c.mainImageId}
          previewUrl={media?.mainUrl}
          onChange={(mainImageId, mainUrl) =>
            onChange({ ...data, composition: { ...c, mainImageId }, compositionMedia: { ...media, mainUrl, productUrls: media?.productUrls ?? {}, decorativeUrls: media?.decorativeUrls ?? {} } })
          }
        />
        <MediaPickerControlled
          label="Secondary image (optional)"
          accept="IMAGE"
          mediaId={c.secondaryImageId}
          previewUrl={media?.secondaryUrl}
          onChange={(secondaryImageId, secondaryUrl) =>
            onChange({ ...data, composition: { ...c, secondaryImageId }, compositionMedia: { ...media, secondaryUrl, productUrls: media?.productUrls ?? {}, decorativeUrls: media?.decorativeUrls ?? {} } })
          }
        />
        <HeroCompositionImageList
          label="Product images"
          ids={c.productImageIds}
          max={6}
          urlMap={media?.productUrls}
          onChange={(productImageIds, nextMap) => {
            update({ productImageIds });
            updateMediaMap("productUrls", nextMap);
          }}
        />
        <HeroCompositionImageList
          label="Decorative images"
          ids={c.decorativeImageIds}
          max={4}
          urlMap={media?.decorativeUrls}
          onChange={(decorativeImageIds, nextMap) => {
            update({ decorativeImageIds });
            updateMediaMap("decorativeUrls", nextMap);
          }}
        />
      </div>

      <div className="space-y-3 rounded-md border border-neutral-800 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">3D Composition — Animation</p>
        <div className="flex flex-wrap items-center gap-4">
          <CheckboxField label="Enable animation" checked={c.animationEnabled} onChange={(animationEnabled) => update({ animationEnabled })} />
          <CheckboxField label="Floating movement" checked={c.floating} onChange={(floating) => update({ floating })} />
          <CheckboxField label="Hover / pointer interaction" checked={c.hoverInteraction} onChange={(hoverInteraction) => update({ hoverInteraction })} />
        </div>
        <SelectField
          label="Entrance animation"
          value={c.entrance}
          onChange={(entrance) => update({ entrance })}
          options={[
            { value: "fade-slide", label: "Fade + slide (default)" },
            { value: "fade", label: "Fade only" },
            { value: "none", label: "None" },
          ]}
        />
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Animation intensity (%)" value={c.intensity} min={0} max={100} onChange={(intensity) => update({ intensity })} />
          <NumberField label="Animation speed (0.5–2x)" value={c.speed} min={0.5} max={2} onChange={(speed) => update({ speed })} />
        </div>
        <NumberField label="Parallax intensity (%)" value={c.parallaxIntensity} min={0} max={100} onChange={(parallaxIntensity) => update({ parallaxIntensity })} />
      </div>

      <div className="space-y-3 rounded-md border border-neutral-800 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">3D Composition — Layout</p>
        <SelectField
          label="Main image position"
          value={c.mainPosition}
          onChange={(mainPosition) => update({ mainPosition })}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" },
          ]}
        />
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Composition width (%)" value={c.width} min={40} max={100} onChange={(width) => update({ width })} />
          <NumberField label="Composition height (%)" value={c.height} min={40} max={100} onChange={(height) => update({ height })} />
        </div>
        <SelectField
          label="Mobile layout"
          value={c.mobileLayout}
          onChange={(mobileLayout) => update({ mobileLayout })}
          options={[
            { value: "simplified", label: "Simplified — main + background, fewer floating layers" },
            { value: "stacked", label: "Stacked — every layer, repositioned" },
            { value: "background-only", label: "Background only" },
          ]}
        />
      </div>

      <div className="space-y-3 rounded-md border border-neutral-800 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">3D Composition — Style</p>
        <SelectField
          label="Frame style"
          value={c.frameStyle}
          onChange={(frameStyle) => update({ frameStyle })}
          options={FRAME_STYLES.map((s) => ({ value: s, label: FRAME_STYLE_LABELS[s] }))}
        />
        {c.frameStyle === "rounded-rectangle" ? (
          <NumberField label="Border radius (px)" value={c.borderRadius} min={0} max={48} onChange={(borderRadius) => update({ borderRadius })} />
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Shadow"
            value={c.shadow}
            onChange={(shadow) => update({ shadow })}
            options={[
              { value: "none", label: "None" },
              { value: "sm", label: "Small" },
              { value: "md", label: "Medium" },
              { value: "lg", label: "Large" },
            ]}
          />
          <SelectField
            label="Overlay"
            value={c.overlay}
            onChange={(overlay) => update({ overlay })}
            options={[
              { value: "none", label: "None" },
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
              { value: "gradient", label: "Gradient (brand)" },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Opacity (%)" value={c.opacity} min={0} max={100} onChange={(opacity) => update({ opacity })} />
          <SelectField
            label="Blend mode"
            value={c.blendMode}
            onChange={(blendMode) => update({ blendMode })}
            options={[
              { value: "normal", label: "Normal" },
              { value: "multiply", label: "Multiply" },
              { value: "screen", label: "Screen" },
              { value: "soft-light", label: "Soft light" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

export function HeroEdit({ data, onChange, locale }: BlockEditProps<HeroData & Partial<HeroResolvedMedia>>) {
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-md border border-neutral-800 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Hero Media</p>
        <SelectField
          label="Media type"
          value={data.mediaType}
          onChange={(mediaType) =>
            // Image/video pickers accept different file types, so a media id selected under one
            // mode can't validly carry over to another (e.g. an image id left in `desktopMediaId`
            // would otherwise show as "already selected" in the video picker, then fail to play
            // as a <video src>). Clear the shared media fields on an actual mode change.
            onChange({
              ...data,
              mediaType,
              ...(mediaType === data.mediaType
                ? {}
                : { desktopMediaId: "", desktopMediaUrl: undefined, mobileMediaId: "", mobileMediaUrl: undefined, posterId: "", posterUrl: undefined }),
              // 3D Composition is built for the immersive edge-to-edge presentation -- default new
              // selections into full-bleed, same "only override the mode's own still-default value"
              // carefulness as the Layout select just below (never clobbers a deliberate split choice
              // an admin already made before switching modes back and forth).
              ...(mediaType === "3d-composition" && mediaType !== data.mediaType && data.layout === "split" ? { layout: "full-bleed" } : {}),
            })
          }
          options={[
            { value: "image", label: "Image" },
            { value: "video", label: "Video" },
            { value: "slideshow", label: "Slideshow" },
            { value: "product-composition", label: "Product Composition" },
            { value: "3d-composition", label: "3D Composition" },
          ]}
        />
        <SelectField
          label="Layout"
          value={data.layout}
          onChange={(layout) =>
            onChange({
              ...data,
              layout,
              // Full-bleed wants an ambient, always-alive background by default; split's framed
              // image wants a one-shot entrance instead. Only switch the animation automatically
              // when it's still at the schema default for the mode being left, so a deliberate
              // custom choice is never silently overridden.
              ...(layout === "full-bleed" && data.animation === "slow-zoom" ? { animation: "cinematic-loop" } : {}),
              ...(layout === "split" && data.animation === "cinematic-loop" ? { animation: "slow-zoom" } : {}),
            })
          }
          options={[
            { value: "split", label: "Split — media in its own column" },
            { value: "full-bleed", label: "Full-bleed — cinematic edge-to-edge background" },
          ]}
        />

        {data.mediaType === "image" ? (
          <>
            <MediaPickerControlled
              label="Desktop image"
              accept="IMAGE"
              mediaId={data.desktopMediaId}
              previewUrl={data.desktopMediaUrl}
              onChange={(desktopMediaId, desktopMediaUrl) => onChange({ ...data, desktopMediaId, desktopMediaUrl })}
            />
            <MediaPickerControlled
              label="Mobile image (optional — falls back to desktop)"
              accept="IMAGE"
              mediaId={data.mobileMediaId}
              previewUrl={data.mobileMediaUrl}
              onChange={(mobileMediaId, mobileMediaUrl) => onChange({ ...data, mobileMediaId, mobileMediaUrl })}
            />
          </>
        ) : null}
        {data.mediaType === "image" || data.mediaType === "video" || data.mediaType === "slideshow" ? (
          <SelectField
            label="Image / video fit"
            value={data.imageFit}
            onChange={(imageFit) => onChange({ ...data, imageFit })}
            options={[
              { value: "cover", label: "Cover — fill the frame, may crop" },
              { value: "contain", label: "Contain — show the complete image, no cropping" },
              { value: "fill", label: "Fill — stretch to the exact frame size" },
              { value: "none", label: "Natural — original size, unscaled" },
            ]}
          />
        ) : null}
        {data.mediaType === "image" || data.mediaType === "slideshow" ? (
          // Slideshow mode falls back to this shared focal point for any slide that hasn't set its
          // own (HeroSlideshow reads slide.focalX ?? data.focalX) -- it needs this control just as
          // much as plain image mode does, e.g. for a banner with baked-in text sitting off-center
          // that gets cropped out on a narrower/taller viewport than the source photo's own aspect ratio.
          <>
            <SelectField
              label="Image position"
              value={data.imagePosition}
              onChange={(imagePosition) =>
                onChange({ ...data, imagePosition, ...(imagePosition === "custom" ? {} : POSITION_PRESETS[imagePosition]) })
              }
              options={[
                { value: "center", label: "Center" },
                { value: "top", label: "Top" },
                { value: "bottom", label: "Bottom" },
                { value: "left", label: "Left" },
                { value: "right", label: "Right" },
                { value: "custom", label: "Custom" },
              ]}
            />
            {data.imagePosition === "custom" ? (
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Focal X (%)" value={data.focalX} min={0} max={100} onChange={(focalX) => onChange({ ...data, focalX })} />
                <NumberField label="Focal Y (%)" value={data.focalY} min={0} max={100} onChange={(focalY) => onChange({ ...data, focalY })} />
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {data.layout === "full-bleed" ? (
        <div className="space-y-3 rounded-md border border-neutral-800 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Full-bleed Layout &amp; Style</p>
          <SelectField
            label="Hero height"
            value={data.heroHeight}
            onChange={(heroHeight) => onChange({ ...data, heroHeight })}
            options={[
              { value: "compact", label: "Compact (~620px)" },
              { value: "standard", label: "Standard (~780px)" },
              { value: "tall", label: "Tall — 85–100vh, 780px minimum" },
              { value: "viewport", label: "Full viewport height" },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Content position"
              value={data.contentPosition}
              onChange={(contentPosition) => onChange({ ...data, contentPosition })}
              options={[
                { value: "start", label: "Start (left in EN / right in AR)" },
                { value: "center", label: "Center" },
                { value: "end", label: "End (right in EN / left in AR)" },
              ]}
            />
            <SelectField
              label="Vertical alignment"
              value={data.verticalAlign}
              onChange={(verticalAlign) => onChange({ ...data, verticalAlign })}
              options={[
                { value: "top", label: "Top" },
                { value: "center", label: "Center" },
                { value: "bottom", label: "Bottom" },
              ]}
            />
          </div>
          <SelectField
            label="Content max width"
            value={data.contentMaxWidth}
            onChange={(contentMaxWidth) => onChange({ ...data, contentMaxWidth })}
            options={[
              { value: "sm", label: "Narrow" },
              { value: "md", label: "Medium" },
              { value: "lg", label: "Wide (default)" },
              { value: "xl", label: "Extra wide" },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Text color"
              value={data.textColorMode}
              onChange={(textColorMode) => onChange({ ...data, textColorMode })}
              options={[
                { value: "auto", label: "Auto (light, for a dark scrim)" },
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
            />
            <SelectField
              label="Accent color"
              value={data.accentColor}
              onChange={(accentColor) => onChange({ ...data, accentColor })}
              options={[
                { value: "wheat", label: "Gold (brand default)" },
                { value: "paper", label: "Off-white" },
              ]}
            />
          </div>
          <SelectField
            label="Overlay gradient direction"
            value={data.overlayDirection}
            onChange={(overlayDirection) => onChange({ ...data, overlayDirection })}
            options={[
              { value: "auto", label: "Auto — matches content position" },
              { value: "start", label: "Start edge" },
              { value: "end", label: "End edge" },
              { value: "center", label: "Center (vertical wash)" },
              { value: "top", label: "Top" },
              { value: "bottom", label: "Bottom" },
              { value: "none", label: "None — flat, no gradient" },
            ]}
          />
          {data.animation === "cinematic-loop" ? (
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Zoom amount (%)" value={data.zoomAmount} min={0} max={20} onChange={(zoomAmount) => onChange({ ...data, zoomAmount })} />
              <NumberField label="Animation speed (sec)" value={data.animationSpeedSec} min={8} max={40} onChange={(animationSpeedSec) => onChange({ ...data, animationSpeedSec })} />
            </div>
          ) : null}
        </div>
      ) : null}

      {data.mediaType === "image" && data.layout === "split" ? (
        <div className="space-y-3 rounded-md border border-neutral-800 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Premium Frame</p>
          <SelectField
            label="Preset"
            value={data.framePreset}
            onChange={(framePreset) =>
              onChange(framePreset ? { ...data, framePreset, ...FRAME_PRESET_BUNDLES[framePreset as keyof typeof FRAME_PRESET_BUNDLES] } : { ...data, framePreset })
            }
            options={[{ value: "", label: "Custom (no preset)" }, ...FRAME_PRESETS.map((p) => ({ value: p, label: FRAME_PRESET_LABELS[p] }))]}
          />
          <SelectField
            label="Frame shape"
            value={data.frameStyle}
            onChange={(frameStyle) => onChange({ ...data, frameStyle, framePreset: "" })}
            options={FRAME_STYLES.map((s) => ({ value: s, label: FRAME_STYLE_LABELS[s] }))}
          />
          <SelectField
            label="Mobile frame shape (optional — same as desktop if unset)"
            value={data.mobileFrameStyle}
            onChange={(mobileFrameStyle) => onChange({ ...data, mobileFrameStyle })}
            options={[{ value: "", label: "Same as desktop" }, ...FRAME_STYLES.map((s) => ({ value: s, label: FRAME_STYLE_LABELS[s] }))]}
          />
          <SelectField
            label="Frame position"
            value={data.framePosition}
            onChange={(framePosition) => onChange({ ...data, framePosition })}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
              { value: "top", label: "Top" },
              { value: "bottom", label: "Bottom" },
              { value: "custom", label: "Custom" },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Offset X (%)" value={data.frameX} min={-50} max={50} onChange={(frameX) => onChange({ ...data, frameX })} />
            <NumberField label="Offset Y (%)" value={data.frameY} min={-50} max={50} onChange={(frameY) => onChange({ ...data, frameY })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Width (%)" value={data.frameWidth} min={20} max={120} onChange={(frameWidth) => onChange({ ...data, frameWidth })} />
            <NumberField label="Height (%)" value={data.frameHeight} min={20} max={120} onChange={(frameHeight) => onChange({ ...data, frameHeight })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Scale" value={data.frameScale} min={0.5} max={1.5} onChange={(frameScale) => onChange({ ...data, frameScale })} />
            <NumberField label="Rotation (deg)" value={data.frameRotation} min={-5} max={5} onChange={(frameRotation) => onChange({ ...data, frameRotation })} />
          </div>
          <CheckboxField
            label="Allow controlled overflow into the text column"
            checked={data.frameOverflow}
            onChange={(frameOverflow) => onChange({ ...data, frameOverflow })}
          />

          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Border"
              value={data.frameBorderStyle}
              onChange={(frameBorderStyle) => onChange({ ...data, frameBorderStyle })}
              options={FRAME_BORDER_STYLES.map((b) => ({ value: b, label: b[0].toUpperCase() + b.slice(1) }))}
            />
            <SelectField
              label="Glow"
              value={data.frameGlow}
              onChange={(frameGlow) => onChange({ ...data, frameGlow })}
              options={FRAME_GLOWS.map((g) => ({ value: g, label: g[0].toUpperCase() + g.slice(1) }))}
            />
          </div>
          {data.frameBorderStyle !== "none" ? (
            <div className="grid grid-cols-3 gap-3">
              <NumberField label="Border width (px)" value={data.frameBorderWidth} min={1} max={8} onChange={(frameBorderWidth) => onChange({ ...data, frameBorderWidth })} />
              <NumberField label="Border opacity (%)" value={data.frameBorderOpacity} min={0} max={100} onChange={(frameBorderOpacity) => onChange({ ...data, frameBorderOpacity })} />
              {data.frameBorderStyle !== "gradient" ? (
                <SelectField
                  label="Border color"
                  value={data.frameBorderColor}
                  onChange={(frameBorderColor) => onChange({ ...data, frameBorderColor })}
                  options={[
                    { value: "wheat", label: "Wheat (gold)" },
                    { value: "harbor", label: "Harbor (teal)" },
                    { value: "ink", label: "Ink (navy)" },
                    { value: "paper", label: "Paper" },
                  ]}
                />
              ) : null}
            </div>
          ) : null}

          <CheckboxField label="Pointer parallax" checked={data.parallaxEnabled} onChange={(parallaxEnabled) => onChange({ ...data, parallaxEnabled })} />
        </div>
      ) : null}

      {data.mediaType === "image" && data.layout === "split" ? (
        <div className="space-y-3 rounded-md border border-neutral-800 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Decorative Typography</p>
          <TextField label="Text (leave empty to disable)" value={data.decorativeText ?? ""} onChange={(decorativeText) => onChange({ ...data, decorativeText })} />
          {data.decorativeText ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Opacity (%)" value={data.decorativeOpacity} min={5} max={12} onChange={(decorativeOpacity) => onChange({ ...data, decorativeOpacity })} />
                <NumberField label="Rotation (deg)" value={data.decorativeRotation} min={-15} max={15} onChange={(decorativeRotation) => onChange({ ...data, decorativeRotation })} />
              </div>
              <SelectField
                label="Position"
                value={data.decorativePosition}
                onChange={(decorativePosition) => onChange({ ...data, decorativePosition })}
                options={[
                  { value: "behind", label: "Behind the frame" },
                  { value: "beside", label: "Beside the frame" },
                  { value: "overlap-start", label: "Overlapping the start edge" },
                  { value: "overlap-end", label: "Overlapping the end edge" },
                ]}
              />
            </>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-3 rounded-md border border-neutral-800 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Hero Media (continued)</p>

        {data.mediaType === "video" ? (
          <>
            <MediaPickerControlled
              label="Desktop video"
              accept="VIDEO"
              mediaId={data.desktopMediaId}
              previewUrl={data.desktopMediaUrl}
              onChange={(desktopMediaId, desktopMediaUrl) => onChange({ ...data, desktopMediaId, desktopMediaUrl })}
            />
            <MediaPickerControlled
              label="Mobile video (optional — falls back to desktop)"
              accept="VIDEO"
              mediaId={data.mobileMediaId}
              previewUrl={data.mobileMediaUrl}
              onChange={(mobileMediaId, mobileMediaUrl) => onChange({ ...data, mobileMediaId, mobileMediaUrl })}
            />
            <MediaPickerControlled
              label="Poster image (shown while loading, and if the video fails)"
              accept="IMAGE"
              mediaId={data.posterId}
              previewUrl={data.posterUrl}
              onChange={(posterId, posterUrl) => onChange({ ...data, posterId, posterUrl })}
            />
            <div className="flex flex-wrap items-center gap-4">
              <CheckboxField label="Autoplay" checked={data.videoAutoplay} onChange={(videoAutoplay) => onChange({ ...data, videoAutoplay })} />
              <CheckboxField label="Muted" checked={data.videoMuted} onChange={(videoMuted) => onChange({ ...data, videoMuted })} />
              <CheckboxField label="Loop" checked={data.videoLoop} onChange={(videoLoop) => onChange({ ...data, videoLoop })} />
            </div>
          </>
        ) : null}
        {data.mediaType !== "product-composition" ? (
          <NumberField
            label={data.mediaType === "3d-composition" ? "Text-readability overlay opacity (%)" : "Overlay opacity (%)"}
            value={data.overlayOpacity}
            min={0}
            max={100}
            onChange={(overlayOpacity) => onChange({ ...data, overlayOpacity })}
          />
        ) : null}
        {data.mediaType !== "slideshow" && data.mediaType !== "product-composition" && data.mediaType !== "3d-composition" ? (
          <SelectField
            label="Animation"
            value={data.animation}
            onChange={(animation) => onChange({ ...data, animation })}
            options={[
              { value: "none", label: "None" },
              { value: "fade", label: "Fade" },
              { value: "slow-zoom", label: "Slow Zoom" },
              { value: "cinematic-loop", label: "Cinematic Loop — infinite breathing zoom (full-bleed)" },
              { value: "parallax", label: "Parallax" },
              { value: "reveal", label: "Reveal" },
              { value: "cinematic", label: "Cinematic" },
              { value: "scale", label: "Scale" },
              { value: "morph", label: "Morph (organic frame shapes only)" },
              { value: "float", label: "Float" },
            ]}
          />
        ) : null}
      </div>

      {data.mediaType === "product-composition" ? (
        <div className="space-y-3 rounded-md border border-neutral-800 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Product Composition</p>
          <p className="text-xs text-neutral-500">
            References real Product CMS records by id — never duplicates their data. If a product&apos;s photo, name, or featured
            status changes in the Product CMS, this Hero updates automatically.
          </p>
          <HeroProductPicker data={data} onChange={onChange} />
        </div>
      ) : null}

      {data.mediaType === "3d-composition" ? (
        <HeroCompositionEditor data={data} onChange={onChange} />
      ) : null}

      {data.mediaType === "slideshow" ? (
        <HeroSlidesEditor data={data} onChange={onChange} locale={locale} />
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Hero Content</p>
          <TextField label="Eyebrow" value={data.eyebrow ?? ""} onChange={(eyebrow) => onChange({ ...data, eyebrow })} dir={dir} />
          <TextField label="Headline" value={data.headline} onChange={(headline) => onChange({ ...data, headline })} dir={dir} />
          <TextareaField label="Description" value={data.subheading ?? ""} onChange={(subheading) => onChange({ ...data, subheading })} dir={dir} rows={2} />

          <div className="space-y-2 rounded-md border border-neutral-800 p-3">
            <p className="text-xs text-neutral-500">Primary button</p>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Label" value={data.ctaLabel ?? ""} onChange={(ctaLabel) => onChange({ ...data, ctaLabel })} dir={dir} />
              <TextField label="URL" value={data.ctaUrl ?? ""} onChange={(ctaUrl) => onChange({ ...data, ctaUrl })} />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <SelectField
                label="Style"
                value={data.ctaStyle}
                onChange={(ctaStyle) => onChange({ ...data, ctaStyle })}
                options={CTA_STYLE_OPTIONS}
                className="min-w-[10rem]"
              />
              <CheckboxField label="Visible" checked={data.ctaVisible} onChange={(ctaVisible) => onChange({ ...data, ctaVisible })} />
              <CheckboxField label="External link" checked={data.ctaExternal} onChange={(ctaExternal) => onChange({ ...data, ctaExternal })} />
            </div>
          </div>

          <div className="space-y-2 rounded-md border border-neutral-800 p-3">
            <p className="text-xs text-neutral-500">Secondary button</p>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Label" value={data.ctaLabel2 ?? ""} onChange={(ctaLabel2) => onChange({ ...data, ctaLabel2 })} dir={dir} />
              <TextField label="URL" value={data.ctaUrl2 ?? ""} onChange={(ctaUrl2) => onChange({ ...data, ctaUrl2 })} />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <SelectField
                label="Style"
                value={data.ctaStyle2}
                onChange={(ctaStyle2) => onChange({ ...data, ctaStyle2 })}
                options={CTA_STYLE_OPTIONS}
                className="min-w-[10rem]"
              />
              <CheckboxField label="Visible" checked={data.ctaVisible2} onChange={(ctaVisible2) => onChange({ ...data, ctaVisible2 })} />
              <CheckboxField label="External link" checked={data.ctaExternal2} onChange={(ctaExternal2) => onChange({ ...data, ctaExternal2 })} />
            </div>
          </div>

          <div className="space-y-3 rounded-md border border-neutral-800 p-3">
            <p className="text-xs text-neutral-500">CTA position</p>
            <SelectField
              label="Mode"
              value={data.ctaPositionMode}
              onChange={(ctaPositionMode) => onChange({ ...data, ctaPositionMode })}
              options={[
                { value: "flow", label: "Flow — inline under the description (default)" },
                { value: "custom", label: "Custom — absolute X/Y over the hero" },
              ]}
            />
            {data.ctaPositionMode === "custom" ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <NumberField label="CTA X (%)" value={data.ctaX} min={0} max={100} onChange={(ctaX) => onChange({ ...data, ctaX })} />
                  <NumberField label="CTA Y (%)" value={data.ctaY} min={0} max={100} onChange={(ctaY) => onChange({ ...data, ctaY })} />
                </div>
                <CheckboxField
                  label="Mirror position for RTL (Arabic)"
                  checked={data.ctaMirrorForRtl}
                  onChange={(ctaMirrorForRtl) => onChange({ ...data, ctaMirrorForRtl })}
                />
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export function HeroRender(props: BlockRenderProps<HeroRenderData>) {
  const { data, locale } = props;
  // Called unconditionally, before the slideshow early-return -- React's rules of hooks require a
  // stable hook-call order across renders, and an admin can switch mediaType (including to/from
  // slideshow) live in the builder, re-rendering this same component instance.
  const { ref: heroRef, x: parallaxX, y: parallaxY, enabled: parallaxSupported } = usePointerParallaxContainer<HTMLDivElement>();

  if (data.mediaType === "slideshow") {
    return <HeroSlideshow {...props} />;
  }

  const hasPrimaryCta = data.ctaVisible && Boolean(data.ctaLabel && data.ctaUrl);
  const hasSecondaryCta = data.ctaVisible2 && Boolean(data.ctaLabel2 && data.ctaUrl2);
  const desktopImageUrl = data.mediaType === "image" ? data.desktopMediaUrl : undefined;
  // "If no mobile image/video is selected: use desktop automatically" (brief §9).
  const mobileImageUrl = data.mediaType === "image" ? (data.mobileMediaUrl || data.desktopMediaUrl) : undefined;
  const desktopVideoUrl = data.mediaType === "video" ? data.desktopMediaUrl : undefined;
  const mobileVideoUrl = data.mediaType === "video" ? (data.mobileMediaUrl || data.desktopMediaUrl) : undefined;
  const imagePositionStyle = { objectPosition: `${data.focalX}% ${data.focalY}%` };
  const imageFitClass = heroImageFitClass(data.imageFit);

  // Pulled out of the content Stagger so "custom" CTA positioning (below) can place it as an
  // independent absolutely-positioned sibling instead -- moving the CTA must never drag the
  // heading/body text along with it (advanced hero CTA controls brief's independence requirement).
  const ctaButtons =
    hasPrimaryCta || hasSecondaryCta ? (
      <div className="flex flex-wrap items-center gap-3">
        {hasPrimaryCta ? (
          <Link
            href={resolveHref(data.ctaUrl, locale)}
            className={buttonClasses(heroButtonVariant(data.ctaStyle), "lg")}
            {...(data.ctaExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {data.ctaLabel}
          </Link>
        ) : null}
        {hasSecondaryCta ? (
          <Link
            href={resolveHref(data.ctaUrl2, locale)}
            className={buttonClasses(heroButtonVariant(data.ctaStyle2), "lg")}
            {...(data.ctaExternal2 ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {data.ctaLabel2}
          </Link>
        ) : null}
      </div>
    ) : null;
  const ctaIsCustom = data.ctaPositionMode === "custom" && Boolean(ctaButtons);
  // Physical X is independent per locale already (dataEn/dataAr are separate objects) -- mirroring
  // only happens when an admin deliberately opts in via ctaMirrorForRtl (brief §13).
  const effectiveCtaX = locale === "ar" && data.ctaMirrorForRtl ? 100 - data.ctaX : data.ctaX;
  const ctaOverlay = ctaIsCustom ? (
    <HeroCtaOverlay x={effectiveCtaX} y={data.ctaY}>
      {ctaButtons}
    </HeroCtaOverlay>
  ) : null;

  const content = (
    // Text column renders first in DOM so it lands on the reading-start side in both LTR and RTL —
    // CSS Grid places track 1 at the inline-start edge, which is genuinely mirrored under dir="rtl",
    // not a manual left/right swap.
    <Stagger>
      {data.eyebrow ? (
        <StaggerItem>
          <p className={`manifest-strip mb-2 opacity-60 ${data.accentColor === "paper" ? "text-paper" : "text-wheat"}`}>{data.eyebrow}</p>
          <RouteLine
            d={HERO_ACCENT_PATH}
            viewBox="0 0 120 16"
            strokeWidth={1.5}
            className={`mb-4 h-4 w-24 flip-rtl ${data.accentColor === "paper" ? "text-paper" : "text-wheat"}`}
          />
        </StaggerItem>
      ) : null}
      <StaggerItem>
        <KineticText as="h1" text={data.headline} className="font-display text-hero measure-ar" />
      </StaggerItem>
      {data.subheading ? (
        <StaggerItem>
          <p className="measure-ar mt-5 max-w-lg text-base leading-relaxed opacity-70 sm:text-lg">{data.subheading}</p>
        </StaggerItem>
      ) : null}
      {!ctaIsCustom && ctaButtons ? <StaggerItem><div className="mt-8">{ctaButtons}</div></StaggerItem> : null}
    </Stagger>
  );

  // The premium frame/shape system (§18-34) applies to image mode in its own "split" column --
  // full-bleed layout keeps its existing edge-to-edge look (that already *is* one of the brief's
  // named frame presets, "Full Bleed Product"), and video mode is untouched for this phase.
  const isFramedImage = data.mediaType === "image" && data.layout === "split" && Boolean(desktopImageUrl);
  const splitOverlayStyle = { background: `linear-gradient(to top, rgba(10,24,38,${data.overlayOpacity / 100}) 0%, rgba(10,24,38,0) 60%)` };
  const parallaxActive = data.parallaxEnabled && parallaxSupported;

  let media: React.ReactNode = null;
  if (isFramedImage) {
    media = (
      <div className={`absolute inset-0 flex ${FRAME_POSITION_ALIGN[data.framePosition]}`}>
        <div
          className="relative h-full transition-transform duration-300 ease-out"
          style={{
            width: `${data.frameWidth}%`,
            height: `${data.frameHeight}%`,
            transform: `rotate(${data.frameRotation}deg) scale(${data.frameScale})`,
          }}
        >
          {/* Pointer-parallax drift, nested inside the static rotate/scale so the two transforms compose independently rather than fighting over one `transform` string. */}
          <div
            className="absolute inset-0 transition-transform duration-300 ease-out"
            style={parallaxActive ? pointerParallaxStyle(parallaxX, parallaxY, 10) : undefined}
          >
            <HeroMediaMotion animation={data.animation} className="absolute inset-0" delay={0.15}>
              {/* Desktop and mobile get their own HeroFrameShape (not one shape with two <Image>s
                  inside it, like image mode's non-framed fallback below) so `mobileFrameStyle` can
                  genuinely differ from the desktop shape (brief §43, e.g. desktop Blob / mobile
                  Oval) -- each shape needs to own exactly the image it clips. */}
              <HeroFrameShape
                frameStyle={data.frameStyle}
                borderStyle={data.frameBorderStyle}
                borderWidthPx={data.frameBorderWidth}
                borderOpacity={data.frameBorderOpacity}
                borderColor={data.frameBorderColor}
                glow={data.frameGlow}
                animation={data.animation}
                className="absolute inset-0 hidden lg:block"
              >
                <Image src={desktopImageUrl as string} alt="" fill priority sizes="(min-width: 1024px) 50vw, 100vw" className={imageFitClass} style={imagePositionStyle} />
                <div className="pointer-events-none absolute inset-0" style={splitOverlayStyle} />
              </HeroFrameShape>
              {mobileImageUrl ? (
                <HeroFrameShape
                  frameStyle={data.mobileFrameStyle || data.frameStyle}
                  borderStyle={data.frameBorderStyle}
                  borderWidthPx={data.frameBorderWidth}
                  borderOpacity={data.frameBorderOpacity}
                  borderColor={data.frameBorderColor}
                  glow={data.frameGlow}
                  animation={data.animation}
                  className="absolute inset-0 lg:hidden"
                >
                  <Image src={mobileImageUrl} alt="" fill priority sizes="100vw" className={imageFitClass} style={imagePositionStyle} />
                  <div className="pointer-events-none absolute inset-0" style={splitOverlayStyle} />
                </HeroFrameShape>
              ) : null}
            </HeroMediaMotion>
          </div>
        </div>
      </div>
    );
  } else if (desktopImageUrl) {
    // Only "full-bleed" layout ever reaches this branch for image mode (split+image always has a
    // frame, however plain -- see isFramedImage above), so a background pointer-parallax offset is
    // always the cinematic-background one here, never a competing effect with split's own frame parallax.
    const bgParallax = data.layout === "full-bleed" && parallaxActive ? pointerParallaxStyle(parallaxX, parallaxY, 12) : undefined;
    media = (
      <div className="absolute inset-0" style={bgParallax}>
        <HeroMediaMotion animation={data.animation} zoomAmount={data.zoomAmount} speedSec={data.animationSpeedSec} className="absolute inset-0">
          {/* Desktop and mobile render as two elements toggled by CSS (matching the same
              art-direction pattern already used by the cold-chain journey's route line) rather
              than one <img> the browser just crops — "mobile" can be a genuinely different photo,
              not a squeeze of the desktop one (brief §9). */}
          <Image src={desktopImageUrl} alt="" fill priority sizes="(min-width: 1024px) 50vw, 100vw" className={`hidden lg:block ${imageFitClass}`} style={imagePositionStyle} />
          {mobileImageUrl ? (
            <Image src={mobileImageUrl} alt="" fill priority sizes="100vw" className={`lg:hidden ${imageFitClass}`} style={imagePositionStyle} />
          ) : null}
        </HeroMediaMotion>
      </div>
    );
  } else if (desktopVideoUrl) {
    // Video mode has no split-only frame variant (isFramedImage requires mediaType === "image"), so
    // this branch covers both split+video (parallax stays off, matching split's own pre-existing
    // behavior for video) and full-bleed+video (background parallax active, matching image mode above).
    const bgParallax = data.layout === "full-bleed" && parallaxActive ? pointerParallaxStyle(parallaxX, parallaxY, 12) : undefined;
    media = (
      <div className="absolute inset-0" style={bgParallax}>
        <HeroMediaMotion animation={data.animation} zoomAmount={data.zoomAmount} speedSec={data.animationSpeedSec} className="absolute inset-0">
          {/* Same desktop/mobile split as image mode — a mobile video can be a genuinely different clip, not a squeeze of the desktop one. */}
          <HeroVideoLayer
            src={desktopVideoUrl}
            poster={data.posterUrl}
            autoPlay={data.videoAutoplay}
            muted={data.videoMuted}
            loop={data.videoLoop}
            className={`hidden h-full w-full lg:block ${imageFitClass}`}
            style={imagePositionStyle}
          />
          {mobileVideoUrl ? (
            <HeroVideoLayer
              src={mobileVideoUrl}
              poster={data.posterUrl}
              autoPlay={data.videoAutoplay}
              muted={data.videoMuted}
              loop={data.videoLoop}
              className={`h-full w-full lg:hidden ${imageFitClass}`}
              style={imagePositionStyle}
            />
          ) : null}
        </HeroMediaMotion>
      </div>
    );
  } else if (data.mediaType === "product-composition") {
    media = <HeroProductComposition data={data} locale={locale} />;
  } else if (data.mediaType === "3d-composition") {
    media = <HeroComposition data={data} locale={locale} />;
  }

  const isProductComposition = data.mediaType === "product-composition";
  // A smaller, independent depth from the background's own parallax above (brief §7's "foreground
  // overlay elements: slightly different movement speed") -- same shared pointer position, just a
  // shallower per-layer travel distance, composed via HeroFrame's fullBleed.contentParallaxStyle.
  const contentParallaxStyle = data.layout === "full-bleed" && parallaxActive ? pointerParallaxStyle(parallaxX, parallaxY, 5) : undefined;
  const fullBleedOptions: HeroFullBleedOptions | undefined =
    data.layout === "full-bleed"
      ? {
          height: data.heroHeight,
          contentPosition: data.contentPosition,
          verticalAlign: data.verticalAlign,
          contentMaxWidth: data.contentMaxWidth,
          textColorMode: data.textColorMode,
          overlayDirection: data.overlayDirection,
          isRtl: locale === "ar",
          contentParallaxStyle,
        }
      : undefined;

  return (
    <div ref={heroRef} className="relative">
      {data.decorativeText ? (
        <HeroDecorativeTypography
          text={data.decorativeText}
          opacity={data.decorativeOpacity}
          position={data.decorativePosition}
          rotation={data.decorativeRotation}
        />
      ) : null}
      <HeroFrame
        layout={data.layout}
        overlayOpacity={data.overlayOpacity}
        media={media}
        content={content}
        allowOverflow={isFramedImage && data.frameOverflow}
        hideOverlay={isFramedImage || isProductComposition}
        fullBleed={fullBleedOptions}
        ctaOverlay={ctaOverlay}
      />
      {/* Extremely subtle cold-chain accent (brief §39-40) -- conceptually tied to the frame
          (the product/scene it's presenting), not a decorative graphic dropped in arbitrarily.
          Only shown alongside a real frame/composition, matching the same "every graphic must
          have conceptual relevance" rule the eyebrow's RouteLine accent already follows. */}
      {(isFramedImage || isProductComposition) && data.frameGlow !== "none" ? (
        <TemperatureIndicator className="pointer-events-none absolute -bottom-2 start-[6%] hidden h-10 text-wheat/40 lg:block flip-rtl" />
      ) : null}
    </div>
  );
}
