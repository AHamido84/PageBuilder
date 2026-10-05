"use client";

import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from "lucide-react";
import { TextField, TextareaField, SelectField, NumberField, CheckboxField, styledProps } from "@/components/admin/ui/field";
import { MediaPickerControlled } from "@/components/admin/ui/media-picker-field";
import { MultiMediaPickerButton, type MediaListItem } from "@/components/admin/ui/media-library-modal";
import { IconButton } from "@/components/admin/ui/icon-button";
import { CTA_STYLE_OPTIONS, HERO_ANIMATION_OPTIONS } from "./hero-shared";
import type { BlockEditProps } from "../../types";
import type { HeroData, HeroResolvedMedia, HeroSlide } from "../content-blocks";

/** Same "" / null sentinels heroSlideSchema itself uses -- see the schema's own comments in
 * content-blocks.ts. A brand-new slide has nothing to fall back to yet other than the Hero-level
 * defaults, exactly the same as an older, pre-existing slide that predates these fields. */
function newSlide(): HeroSlide {
  return {
    id: crypto.randomUUID(),
    enabled: true,
    mediaType: "image",
    desktopMediaId: "",
    mobileMediaId: "",
    posterId: "",
    eyebrow: "",
    headline: "",
    description: "",
    ctaLabel: "",
    ctaUrl: "",
    ctaLabel2: "",
    ctaUrl2: "",
    durationMs: 6000,
    animation: "slow-zoom",
    imageFit: "",
    imageFitMobile: "",
    focalX: null,
    focalY: null,
    ctaStyle: "",
    ctaStyle2: "",
    ctaPositionMode: "",
    ctaX: null,
    ctaY: null,
    overlayOpacity: null,
    imageFitTablet: "",
    focalXTablet: null,
    focalYTablet: null,
    focalXMobile: null,
    focalYMobile: null,
    ctaXTablet: null,
    ctaYTablet: null,
    ctaXMobile: null,
    ctaYMobile: null,
    animationDurationMs: null,
    animationDelayMs: null,
    overlayDirection: "",
  };
}

/** The slide-list editor for Hero's slideshow mode. A separate file from hero.tsx (which already
 * carries image/video Edit+Render) since each slide repeats nearly every field the top-level Hero
 * form has -- media, content, CTAs, plus its own duration/animation -- and folding that into the
 * same file would make hero.tsx unwieldy. Pattern: an add/remove/reorder/duplicate list, same idea
 * as TimelineEdit/IconCardsEdit, extended with up/down move and duplicate since a slideshow's order
 * genuinely matters (unlike a timeline's chronological items or a feature grid's unordered cards). */
export function HeroSlidesEditor({ data, onChange, locale }: BlockEditProps<HeroData & Partial<HeroResolvedMedia>>) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const slides = data.slides;
  const slideMedia = data.slideMedia;

  function setSlides(next: HeroSlide[]) {
    onChange({ ...data, slides: next });
  }
  function updateSlide(i: number, patch: Partial<HeroSlide>) {
    setSlides(slides.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function moveSlide(i: number, delta: -1 | 1) {
    const j = i + delta;
    if (j < 0 || j >= slides.length) return;
    const next = [...slides];
    [next[i], next[j]] = [next[j], next[i]];
    setSlides(next);
  }
  // Lets an admin pick several images in one open/close cycle instead of opening the single-select
  // picker once per slide -- each picked image becomes its own new slide (desktop image only; mobile
  // image, content, and CTAs are left for the admin to fill in per-slide afterward, same as "Add
  // slide"). Silently caps at the 12-slide limit rather than erroring if a bulk pick would exceed it.
  function bulkAddSlides(items: MediaListItem[]) {
    const room = 12 - slides.length;
    const toAdd = items.slice(0, Math.max(0, room));
    if (toAdd.length === 0) return;
    const created = toAdd.map((item) => ({ slide: { ...newSlide(), desktopMediaId: item.id }, url: item.url }));
    const nextSlideMedia = { ...(slideMedia ?? {}) };
    for (const { slide, url } of created) nextSlideMedia[slide.id] = { desktopUrl: url };
    onChange({ ...data, slides: [...slides, ...created.map((c) => c.slide)], slideMedia: nextSlideMedia });
  }
  // Picking a media id also stores its URL locally (mirroring the top-level Hero picker's own
  // pattern) so the picker's thumbnail updates immediately, without waiting on the next server
  // round trip through resolveHeroData to repopulate `slideMedia`.
  function setSlideMedia(
    i: number,
    idKey: "desktopMediaId" | "mobileMediaId" | "posterId",
    urlKey: "desktopUrl" | "mobileUrl" | "posterUrl",
    id: string,
    url: string
  ) {
    const slide = slides[i];
    const nextSlides = slides.map((s, idx) => (idx === i ? { ...s, [idKey]: id } : s));
    const nextSlideMedia = { ...(slideMedia ?? {}), [slide.id]: { ...(slideMedia?.[slide.id] ?? {}), [urlKey]: url } };
    onChange({ ...data, slides: nextSlides, slideMedia: nextSlideMedia });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Slides</p>
        <p className="text-xs text-neutral-600">{slides.length} / 12</p>
      </div>

      {data.mediaType === "carousel" ? (
        // Carousel always slides along its track; the only choice is whether it advances by itself.
        <CheckboxField
          label="Autoplay — advance using each slide's display duration (off = manual arrows/swipe only)"
          checked={data.carouselAutoplay}
          onChange={(carouselAutoplay) => onChange({ ...data, carouselAutoplay })}
        />
      ) : (
        <SelectField
          label="Transition between slides"
          value={data.slideTransition}
          onChange={(slideTransition) => onChange({ ...data, slideTransition })}
          options={[
            { value: "crossfade", label: "Crossfade" },
            { value: "cut", label: "Instant cut" },
          ]}
        />
      )}

      {/* Phase 4 fix: a genuine pre-existing gap -- HeroSlideshow's render already read
          data.ctaMirrorForRtl for every slide's custom CTA position (this is a single Hero-level
          flag shared by every slide in this locale's array, not per-slide, exactly like the
          top-level image/video mode's own field of the same name), but this control only ever
          lived in the flat "Hero Content" section that Slideshow mode replaces with this editor --
          so there was no way to actually set it once an admin switched to Slideshow. Moved here,
          once, rather than duplicated per slide. */}
      <CheckboxField
        label="Mirror CTA position for RTL (Arabic) — applies to every slide's custom CTA position in this locale"
        checked={data.ctaMirrorForRtl}
        onChange={(ctaMirrorForRtl) => onChange({ ...data, ctaMirrorForRtl })}
      />

      {slides.map((slide, i) => {
        const media = slideMedia?.[slide.id];
        return (
          <details key={slide.id} className="rounded-md border border-neutral-800" open={slides.length <= 1}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-3 text-xs font-medium text-neutral-300 [&::-webkit-details-marker]:hidden">
              <span className={slide.enabled ? "" : "opacity-40"}>
                Slide {i + 1}
                {slide.headline ? ` — ${slide.headline}` : ""}
                {!slide.enabled ? " (disabled)" : ""}
              </span>
            </summary>
            <div className="space-y-3 border-t border-neutral-800 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CheckboxField label="Enabled" checked={slide.enabled} onChange={(enabled) => updateSlide(i, { enabled })} />
                <div className="flex items-center gap-1">
                  <IconButton icon={ArrowUp} label="Move up" onClick={() => moveSlide(i, -1)} disabled={i === 0} />
                  <IconButton icon={ArrowDown} label="Move down" onClick={() => moveSlide(i, 1)} disabled={i === slides.length - 1} />
                  <IconButton
                    icon={Copy}
                    label="Duplicate"
                    onClick={() => {
                      const copy = { ...slide, id: crypto.randomUUID() };
                      setSlides([...slides.slice(0, i + 1), copy, ...slides.slice(i + 1)]);
                    }}
                  />
                  <IconButton icon={Trash2} label="Remove" danger onClick={() => setSlides(slides.filter((_, idx) => idx !== i))} />
                </div>
              </div>

              <SelectField
                label="Media type"
                value={slide.mediaType}
                onChange={(mediaType) =>
                  updateSlide(
                    i,
                    mediaType === slide.mediaType
                      ? { mediaType }
                      : { mediaType, desktopMediaId: "", mobileMediaId: "", posterId: "" }
                  )
                }
                options={[
                  { value: "image", label: "Image" },
                  { value: "video", label: "Video" },
                ]}
              />
              <MediaPickerControlled uploadFolderName="Hero"
                label={slide.mediaType === "video" ? "Desktop video" : "Desktop image"}
                accept={slide.mediaType === "video" ? "VIDEO" : "IMAGE"}
                mediaId={slide.desktopMediaId}
                previewUrl={media?.desktopUrl}
                onChange={(id, url) => setSlideMedia(i, "desktopMediaId", "desktopUrl", id, url)}
              />
              <MediaPickerControlled uploadFolderName="Hero"
                label={(slide.mediaType === "video" ? "Mobile video" : "Mobile image") + " (optional — falls back to desktop)"}
                accept={slide.mediaType === "video" ? "VIDEO" : "IMAGE"}
                mediaId={slide.mobileMediaId}
                previewUrl={media?.mobileUrl}
                onChange={(id, url) => setSlideMedia(i, "mobileMediaId", "mobileUrl", id, url)}
              />
              {slide.mediaType === "video" ? (
                <MediaPickerControlled uploadFolderName="Hero"
                  label="Poster image (shown while loading, and if the video fails)"
                  accept="IMAGE"
                  mediaId={slide.posterId}
                  previewUrl={media?.posterUrl}
                  onChange={(id, url) => setSlideMedia(i, "posterId", "posterUrl", id, url)}
                />
              ) : null}

              {/* Every field below is genuinely per-slide -- "" / null means "not set on this
                  slide", resolved at render time against this slideshow's own hero-level values
                  (see HeroSlideshow), never a single setting shared across every slide. */}
              <div className="grid grid-cols-3 gap-3">
                <SelectField
                  label="Image fit (desktop)"
                  value={slide.imageFit}
                  onChange={(imageFit) => updateSlide(i, { imageFit })}
                  options={[
                    { value: "", label: "Use Hero default (Cover)" },
                    { value: "cover", label: "Cover — fill, may crop" },
                    { value: "contain", label: "Contain — no cropping" },
                    { value: "fill", label: "Fill — stretch" },
                    { value: "none", label: "Natural — unscaled" },
                  ]}
                />
                {/* Phase 4 -- the tablet tier, previously nonexistent (only a desktop/mobile split existed). */}
                <SelectField
                  label="Image fit (tablet)"
                  value={slide.imageFitTablet}
                  onChange={(imageFitTablet) => updateSlide(i, { imageFitTablet })}
                  options={[
                    { value: "", label: "Same as desktop" },
                    { value: "cover", label: "Cover — fill, may crop" },
                    { value: "contain", label: "Contain — no cropping" },
                    { value: "fill", label: "Fill — stretch" },
                    { value: "none", label: "Natural — unscaled" },
                  ]}
                />
                <SelectField
                  label="Image fit (mobile)"
                  value={slide.imageFitMobile}
                  onChange={(imageFitMobile) => updateSlide(i, { imageFitMobile })}
                  options={[
                    { value: "", label: "Same as desktop" },
                    { value: "cover", label: "Cover — fill, may crop" },
                    { value: "contain", label: "Contain — no cropping" },
                    { value: "fill", label: "Fill — stretch" },
                    { value: "none", label: "Natural — unscaled" },
                  ]}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label="Focal X (%)"
                  value={slide.focalX ?? 50}
                  min={0}
                  max={100}
                  onChange={(focalX) => updateSlide(i, { focalX })}
                />
                <NumberField
                  label="Focal Y (%)"
                  value={slide.focalY ?? 50}
                  min={0}
                  max={100}
                  onChange={(focalY) => updateSlide(i, { focalY })}
                />
              </div>
              {/* Phase 4 -- independent focal point per breakpoint tier. */}
              <div className="flex items-center gap-4">
                <CheckboxField
                  label="Override focal point on tablet"
                  checked={slide.focalXTablet !== null}
                  onChange={(checked) => updateSlide(i, { focalXTablet: checked ? (slide.focalX ?? 50) : null, focalYTablet: checked ? (slide.focalY ?? 50) : null })}
                />
              </div>
              {slide.focalXTablet !== null ? (
                <div className="grid grid-cols-2 gap-3">
                  <NumberField label="Tablet focal X (%)" value={slide.focalXTablet} min={0} max={100} onChange={(focalXTablet) => updateSlide(i, { focalXTablet })} />
                  <NumberField label="Tablet focal Y (%)" value={slide.focalYTablet ?? 50} min={0} max={100} onChange={(focalYTablet) => updateSlide(i, { focalYTablet })} />
                </div>
              ) : null}
              <div className="flex items-center gap-4">
                <CheckboxField
                  label="Override focal point on mobile"
                  checked={slide.focalXMobile !== null}
                  onChange={(checked) => updateSlide(i, { focalXMobile: checked ? (slide.focalX ?? 50) : null, focalYMobile: checked ? (slide.focalY ?? 50) : null })}
                />
              </div>
              {slide.focalXMobile !== null ? (
                <div className="grid grid-cols-2 gap-3">
                  <NumberField label="Mobile focal X (%)" value={slide.focalXMobile} min={0} max={100} onChange={(focalXMobile) => updateSlide(i, { focalXMobile })} />
                  <NumberField label="Mobile focal Y (%)" value={slide.focalYMobile ?? 50} min={0} max={100} onChange={(focalYMobile) => updateSlide(i, { focalYMobile })} />
                </div>
              ) : null}

              <TextField label="Eyebrow" {...styledProps(slide, "eyebrow", (next) => setSlides(slides.map((s, idx) => (idx === i ? next : s))))} dir={dir} />
              <TextField label="Headline" {...styledProps(slide, "headline", (next) => setSlides(slides.map((s, idx) => (idx === i ? next : s))))} dir={dir} />
              <TextareaField label="Description" {...styledProps(slide, "description", (next) => setSlides(slides.map((s, idx) => (idx === i ? next : s))))} dir={dir} rows={2} />

              <div className="grid grid-cols-2 gap-3">
                <TextField label="Primary CTA label" {...styledProps(slide, "ctaLabel", (next) => setSlides(slides.map((s, idx) => (idx === i ? next : s))))} dir={dir} />
                <TextField label="Primary CTA URL" value={slide.ctaUrl ?? ""} onChange={(ctaUrl) => updateSlide(i, { ctaUrl })} />
              </div>
              <SelectField
                label="Primary CTA style"
                value={slide.ctaStyle}
                onChange={(ctaStyle) => updateSlide(i, { ctaStyle })}
                options={[{ value: "", label: "Use Hero default (Primary)" }, ...CTA_STYLE_OPTIONS]}
              />
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Secondary CTA label" {...styledProps(slide, "ctaLabel2", (next) => setSlides(slides.map((s, idx) => (idx === i ? next : s))))} dir={dir} />
                <TextField label="Secondary CTA URL" value={slide.ctaUrl2 ?? ""} onChange={(ctaUrl2) => updateSlide(i, { ctaUrl2 })} />
              </div>
              <SelectField
                label="Secondary CTA style"
                value={slide.ctaStyle2}
                onChange={(ctaStyle2) => updateSlide(i, { ctaStyle2 })}
                options={[{ value: "", label: "Use Hero default (Secondary)" }, ...CTA_STYLE_OPTIONS]}
              />

              <div className="space-y-3 rounded-md border border-neutral-800 p-3">
                <p className="text-xs text-neutral-500">CTA position (this slide)</p>
                <SelectField
                  label="Mode"
                  value={slide.ctaPositionMode}
                  onChange={(ctaPositionMode) => updateSlide(i, { ctaPositionMode })}
                  options={[
                    { value: "", label: "Use Hero default (Flow)" },
                    { value: "flow", label: "Flow — inline under the description" },
                    { value: "custom", label: "Custom — absolute X/Y over this slide" },
                  ]}
                />
                {slide.ctaPositionMode === "custom" ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <NumberField label="CTA X (%)" value={slide.ctaX ?? 75} min={0} max={100} onChange={(ctaX) => updateSlide(i, { ctaX })} />
                      <NumberField label="CTA Y (%)" value={slide.ctaY ?? 80} min={0} max={100} onChange={(ctaY) => updateSlide(i, { ctaY })} />
                    </div>
                    {/* Phase 4 -- independent CTA position per breakpoint tier, previously a single X/Y at every viewport width. */}
                    <div className="flex items-center gap-4">
                      <CheckboxField
                        label="Override CTA position on tablet"
                        checked={slide.ctaXTablet !== null}
                        onChange={(checked) => updateSlide(i, { ctaXTablet: checked ? (slide.ctaX ?? 75) : null, ctaYTablet: checked ? (slide.ctaY ?? 80) : null })}
                      />
                    </div>
                    {slide.ctaXTablet !== null ? (
                      <div className="grid grid-cols-2 gap-3">
                        <NumberField label="Tablet CTA X (%)" value={slide.ctaXTablet} min={0} max={100} onChange={(ctaXTablet) => updateSlide(i, { ctaXTablet })} />
                        <NumberField label="Tablet CTA Y (%)" value={slide.ctaYTablet ?? 80} min={0} max={100} onChange={(ctaYTablet) => updateSlide(i, { ctaYTablet })} />
                      </div>
                    ) : null}
                    <div className="flex items-center gap-4">
                      <CheckboxField
                        label="Override CTA position on mobile"
                        checked={slide.ctaXMobile !== null}
                        onChange={(checked) => updateSlide(i, { ctaXMobile: checked ? (slide.ctaX ?? 75) : null, ctaYMobile: checked ? (slide.ctaY ?? 80) : null })}
                      />
                    </div>
                    {slide.ctaXMobile !== null ? (
                      <div className="grid grid-cols-2 gap-3">
                        <NumberField label="Mobile CTA X (%)" value={slide.ctaXMobile} min={0} max={100} onChange={(ctaXMobile) => updateSlide(i, { ctaXMobile })} />
                        <NumberField label="Mobile CTA Y (%)" value={slide.ctaYMobile ?? 80} min={0} max={100} onChange={(ctaYMobile) => updateSlide(i, { ctaYMobile })} />
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>

              <SelectField
                label="Overlay (this slide)"
                value={slide.overlayDirection}
                onChange={(overlayDirection) => updateSlide(i, { overlayDirection })}
                options={[
                  { value: "", label: "Use Hero default" },
                  { value: "auto", label: "Gradient — behind the text" },
                  { value: "start", label: "Gradient — from reading start" },
                  { value: "end", label: "Gradient — from reading end" },
                  { value: "bottom", label: "Gradient — from bottom" },
                  { value: "top", label: "Gradient — from top" },
                  { value: "center", label: "Gradient — centered" },
                  { value: "none", label: "No overlay" },
                ]}
              />
              <div className="flex items-center gap-4">
                <CheckboxField
                  label="Override overlay opacity for this slide"
                  checked={slide.overlayOpacity !== null}
                  onChange={(checked) => updateSlide(i, { overlayOpacity: checked ? 35 : null })}
                />
                {slide.overlayOpacity !== null ? (
                  <NumberField
                    label="Overlay opacity (%)"
                    value={slide.overlayOpacity}
                    min={0}
                    max={100}
                    onChange={(overlayOpacity) => updateSlide(i, { overlayOpacity })}
                  />
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label="Slide display duration (ms)"
                  value={slide.durationMs}
                  min={1000}
                  max={30000}
                  onChange={(durationMs) => updateSlide(i, { durationMs })}
                />
                <SelectField
                  label="Animation"
                  value={slide.animation}
                  onChange={(animation) => updateSlide(i, { animation })}
                  options={HERO_ANIMATION_OPTIONS}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label="Animation duration (ms, optional)"
                  value={slide.animationDurationMs ?? 0}
                  min={0}
                  max={30000}
                  onChange={(v) => updateSlide(i, { animationDurationMs: v <= 0 ? null : v })}
                />
                <NumberField
                  label="Animation delay (ms, optional)"
                  value={slide.animationDelayMs ?? 0}
                  min={0}
                  max={5000}
                  onChange={(v) => updateSlide(i, { animationDelayMs: v <= 0 ? null : v })}
                />
              </div>
            </div>
          </details>
        );
      })}

      {slides.length < 12 ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSlides([...slides, newSlide()])}
            className="flex items-center gap-1.5 rounded-md border border-dashed border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
          >
            <Plus size={14} /> Add slide
          </button>
          <MultiMediaPickerButton uploadFolderName="Hero" label="Bulk add images as slides..." accept="IMAGE" onConfirm={bulkAddSlides} />
        </div>
      ) : null}
    </div>
  );
}
