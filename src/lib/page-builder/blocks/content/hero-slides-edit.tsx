"use client";

import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from "lucide-react";
import { TextField, TextareaField, SelectField, NumberField, CheckboxField } from "@/components/admin/ui/field";
import { MediaPickerControlled } from "@/components/admin/ui/media-picker-field";
import { MultiMediaPickerButton, type MediaListItem } from "@/components/admin/ui/media-library-modal";
import { IconButton } from "@/components/admin/ui/icon-button";
import { CTA_STYLE_OPTIONS } from "./hero-shared";
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

      <SelectField
        label="Transition between slides"
        value={data.slideTransition}
        onChange={(slideTransition) => onChange({ ...data, slideTransition })}
        options={[
          { value: "crossfade", label: "Crossfade" },
          { value: "cut", label: "Instant cut" },
        ]}
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
              <MediaPickerControlled
                label={slide.mediaType === "video" ? "Desktop video" : "Desktop image"}
                accept={slide.mediaType === "video" ? "VIDEO" : "IMAGE"}
                mediaId={slide.desktopMediaId}
                previewUrl={media?.desktopUrl}
                onChange={(id, url) => setSlideMedia(i, "desktopMediaId", "desktopUrl", id, url)}
              />
              <MediaPickerControlled
                label={(slide.mediaType === "video" ? "Mobile video" : "Mobile image") + " (optional — falls back to desktop)"}
                accept={slide.mediaType === "video" ? "VIDEO" : "IMAGE"}
                mediaId={slide.mobileMediaId}
                previewUrl={media?.mobileUrl}
                onChange={(id, url) => setSlideMedia(i, "mobileMediaId", "mobileUrl", id, url)}
              />
              {slide.mediaType === "video" ? (
                <MediaPickerControlled
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
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Image fit"
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

              <TextField label="Eyebrow" value={slide.eyebrow ?? ""} onChange={(eyebrow) => updateSlide(i, { eyebrow })} dir={dir} />
              <TextField label="Headline" value={slide.headline ?? ""} onChange={(headline) => updateSlide(i, { headline })} dir={dir} />
              <TextareaField label="Description" value={slide.description ?? ""} onChange={(description) => updateSlide(i, { description })} dir={dir} rows={2} />

              <div className="grid grid-cols-2 gap-3">
                <TextField label="Primary CTA label" value={slide.ctaLabel ?? ""} onChange={(ctaLabel) => updateSlide(i, { ctaLabel })} dir={dir} />
                <TextField label="Primary CTA URL" value={slide.ctaUrl ?? ""} onChange={(ctaUrl) => updateSlide(i, { ctaUrl })} />
              </div>
              <SelectField
                label="Primary CTA style"
                value={slide.ctaStyle}
                onChange={(ctaStyle) => updateSlide(i, { ctaStyle })}
                options={[{ value: "", label: "Use Hero default (Primary)" }, ...CTA_STYLE_OPTIONS]}
              />
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Secondary CTA label" value={slide.ctaLabel2 ?? ""} onChange={(ctaLabel2) => updateSlide(i, { ctaLabel2 })} dir={dir} />
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
                  <div className="grid grid-cols-2 gap-3">
                    <NumberField label="CTA X (%)" value={slide.ctaX ?? 75} min={0} max={100} onChange={(ctaX) => updateSlide(i, { ctaX })} />
                    <NumberField label="CTA Y (%)" value={slide.ctaY ?? 80} min={0} max={100} onChange={(ctaY) => updateSlide(i, { ctaY })} />
                  </div>
                ) : null}
              </div>

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
                <NumberField label="Duration (ms)" value={slide.durationMs} min={1000} max={30000} onChange={(durationMs) => updateSlide(i, { durationMs })} />
                <SelectField
                  label="Animation"
                  value={slide.animation}
                  onChange={(animation) => updateSlide(i, { animation })}
                  options={[
                    { value: "none", label: "None" },
                    { value: "fade", label: "Fade" },
                    { value: "slow-zoom", label: "Slow Zoom" },
                    { value: "parallax", label: "Parallax" },
                    { value: "reveal", label: "Reveal" },
                    { value: "cinematic", label: "Cinematic" },
                  ]}
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
          <MultiMediaPickerButton label="Bulk add images as slides..." accept="IMAGE" onConfirm={bulkAddSlides} />
        </div>
      ) : null}
    </div>
  );
}
