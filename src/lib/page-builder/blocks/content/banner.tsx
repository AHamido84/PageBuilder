"use client";

import Link from "next/link";
import { TextField, TextareaField, SelectField, NumberField, CheckboxField } from "@/components/admin/ui/field";
import { MediaPickerControlled } from "@/components/admin/ui/media-picker-field";
import { CmsFillImage } from "@/components/media/cms-image";
import { buttonClasses } from "@/components/ui/button";
import { Stagger, StaggerItem } from "@/lib/motion/primitives";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import { resolveHref } from "../../href";
import type { BannerData, BannerHeight } from "../content-blocks";
import { CTA_STYLE_OPTIONS, HERO_ANIMATION_OPTIONS, HeroMediaMotion, HeroVideoLayer, heroButtonVariant, heroImageFitClass, resolveOverlayGradient } from "./hero-shared";

/**
 * Redesign PHASE 5 -- the reusable Banner section: a promo/story band that can be a full
 * background image or video with text over it, a split image + text band, or text only. Shares
 * Hero's primitives (CTA styles, overlay gradient, media animation, video fallback) so a Banner and
 * a Hero on the same page look like one system, but is deliberately much smaller than Hero: one
 * piece of content, no slides, no frame shapes.
 */

// Literal class strings per token (Tailwind's JIT needs them physically present in source).
// "custom" reads the --banner-h custom property set inline from heightCustomValue.
const HEIGHT_CLASSES: Record<BannerHeight, string> = {
  auto: "",
  small: "min-h-[280px] sm:min-h-[320px]",
  medium: "min-h-[380px] sm:min-h-[440px] lg:min-h-[480px]",
  large: "min-h-[480px] sm:min-h-[560px] lg:min-h-[640px]",
  viewport: "min-h-[100svh]",
  custom: "min-h-[var(--banner-h)]",
};
// Mobile-only overrides (below `sm`), applied after the base classes so they win on phones.
const MOBILE_HEIGHT_CLASSES: Record<Exclude<BannerHeight, "custom">, string> = {
  auto: "max-sm:min-h-0",
  small: "max-sm:min-h-[280px]",
  medium: "max-sm:min-h-[380px]",
  large: "max-sm:min-h-[480px]",
  viewport: "max-sm:min-h-[100svh]",
};
const CONTENT_H = { start: "items-start text-start", center: "items-center text-center", end: "items-end text-end" } as const;
const CONTENT_V = { top: "justify-start", center: "justify-center", bottom: "justify-end" } as const;
const CONTENT_MAX = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-2xl", xl: "max-w-3xl" } as const;

const FIT_OPTIONS = [
  { value: "cover", label: "Cover — fill, may crop" },
  { value: "contain", label: "Contain — no cropping" },
  { value: "fill", label: "Fill — stretch" },
  { value: "none", label: "Natural — unscaled" },
] as const;

const HEIGHT_OPTIONS = [
  { value: "auto", label: "Auto (content height)" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "viewport", label: "Full viewport" },
] as const;

export function BannerEdit({ data, onChange, locale }: BlockEditProps<BannerData>) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const set = (patch: Partial<BannerData>) => onChange({ ...data, ...patch });
  const showBackground = data.layout !== "text";

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-md border border-neutral-800 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Banner Media</p>
        <SelectField
          label="Layout"
          value={data.layout}
          onChange={(layout) => set({ layout })}
          options={[
            { value: "background", label: "Background — media fills the banner, text on top" },
            { value: "split", label: "Split — image beside the text" },
            { value: "text", label: "Text only" },
          ]}
        />
        {data.layout === "split" ? (
          <>
            <MediaPickerControlled
              uploadFolderName="Banners"
              label="Image"
              mediaId={data.image?.id ?? ""}
              previewUrl={data.image?.url}
              onChange={(id, url) => set({ image: id ? { id, url } : null })}
            />
            <SelectField
              label="Image side"
              value={data.imageSide}
              onChange={(imageSide) => set({ imageSide })}
              options={[
                { value: "start", label: "Reading start (left in English, right in Arabic)" },
                { value: "end", label: "Reading end (right in English, left in Arabic)" },
              ]}
            />
          </>
        ) : null}
        {showBackground ? (
          <>
            <SelectField
              label={data.layout === "split" ? "Background (optional)" : "Background type"}
              value={data.backgroundType}
              onChange={(backgroundType) => set({ backgroundType })}
              options={[
                { value: "image", label: "Image" },
                { value: "video", label: "Video" },
              ]}
            />
            {data.backgroundType === "image" ? (
              <>
                <MediaPickerControlled
                  uploadFolderName="Backgrounds"
                  label="Background image"
                  mediaId={data.backgroundImage?.id ?? ""}
                  previewUrl={data.backgroundImage?.url}
                  onChange={(id, url) => set({ backgroundImage: id ? { id, url } : null })}
                />
                <MediaPickerControlled
                  uploadFolderName="Backgrounds"
                  label="Mobile background image (optional — falls back to the one above)"
                  mediaId={data.backgroundImageMobile?.id ?? ""}
                  previewUrl={data.backgroundImageMobile?.url}
                  onChange={(id, url) => set({ backgroundImageMobile: id ? { id, url } : null })}
                />
              </>
            ) : (
              <>
                <MediaPickerControlled
                  uploadFolderName="Backgrounds"
                  label="Background video"
                  accept="VIDEO"
                  mediaId={data.backgroundVideo?.id ?? ""}
                  previewUrl={data.backgroundVideo?.url}
                  onChange={(id, url) => set({ backgroundVideo: id ? { id, url } : null })}
                />
                <MediaPickerControlled
                  uploadFolderName="Backgrounds"
                  label="Poster image (shown while loading, and if the video fails)"
                  mediaId={data.videoPoster?.id ?? ""}
                  previewUrl={data.videoPoster?.url}
                  onChange={(id, url) => set({ videoPoster: id ? { id, url } : null })}
                />
              </>
            )}
          </>
        ) : null}
        {data.layout !== "text" ? (
          <>
            <SelectField label="Image fit" value={data.imageFit} onChange={(imageFit) => set({ imageFit })} options={[...FIT_OPTIONS]} />
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Focal X (%)" value={data.focalX} min={0} max={100} onChange={(focalX) => set({ focalX })} />
              <NumberField label="Focal Y (%)" value={data.focalY} min={0} max={100} onChange={(focalY) => set({ focalY })} />
            </div>
            <CheckboxField
              label="Override focal point on mobile"
              checked={data.focalXMobile !== null}
              onChange={(checked) => set({ focalXMobile: checked ? data.focalX : null, focalYMobile: checked ? data.focalY : null })}
            />
            {data.focalXMobile !== null ? (
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Mobile focal X (%)" value={data.focalXMobile} min={0} max={100} onChange={(focalXMobile) => set({ focalXMobile })} />
                <NumberField label="Mobile focal Y (%)" value={data.focalYMobile ?? 50} min={0} max={100} onChange={(focalYMobile) => set({ focalYMobile })} />
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Overlay"
                value={data.overlay}
                onChange={(overlay) => set({ overlay })}
                options={[
                  { value: "auto", label: "Gradient — behind the text" },
                  { value: "start", label: "Gradient — from reading start" },
                  { value: "end", label: "Gradient — from reading end" },
                  { value: "bottom", label: "Gradient — from bottom" },
                  { value: "top", label: "Gradient — from top" },
                  { value: "center", label: "Gradient — centered" },
                  { value: "none", label: "No overlay" },
                ]}
              />
              <NumberField label="Overlay opacity (%)" value={data.overlayOpacity} min={0} max={100} onChange={(overlayOpacity) => set({ overlayOpacity })} />
            </div>
            <SelectField label="Media animation" value={data.animation} onChange={(animation) => set({ animation })} options={HERO_ANIMATION_OPTIONS} />
          </>
        ) : null}
      </div>

      <div className="space-y-3 rounded-md border border-neutral-800 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Layout &amp; Size</p>
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Height"
            value={data.height}
            onChange={(height) => set({ height })}
            options={[...HEIGHT_OPTIONS, { value: "custom", label: "Custom" }]}
          />
          <SelectField
            label="Mobile height"
            value={data.heightMobile}
            onChange={(heightMobile) => set({ heightMobile })}
            options={[{ value: "", label: "Same as desktop" }, ...HEIGHT_OPTIONS]}
          />
        </div>
        {data.height === "custom" ? (
          <TextField label="Custom height (e.g. 520px, 60vh)" value={data.heightCustomValue ?? ""} onChange={(heightCustomValue) => set({ heightCustomValue })} />
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Text position"
            value={data.contentPosition}
            onChange={(contentPosition) => set({ contentPosition })}
            options={[
              { value: "start", label: "Start" },
              { value: "center", label: "Center" },
              { value: "end", label: "End" },
            ]}
          />
          <SelectField
            label="Vertical align"
            value={data.verticalAlign}
            onChange={(verticalAlign) => set({ verticalAlign })}
            options={[
              { value: "top", label: "Top" },
              { value: "center", label: "Center" },
              { value: "bottom", label: "Bottom" },
            ]}
          />
          <SelectField
            label="Text width"
            value={data.contentMaxWidth}
            onChange={(contentMaxWidth) => set({ contentMaxWidth })}
            options={[
              { value: "sm", label: "Narrow" },
              { value: "md", label: "Medium" },
              { value: "lg", label: "Wide" },
              { value: "xl", label: "Extra wide" },
            ]}
          />
          <SelectField
            label="Text color"
            value={data.textColorMode}
            onChange={(textColorMode) => set({ textColorMode })}
            options={[
              { value: "auto", label: "Auto (light on media)" },
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
          />
        </div>
        <CheckboxField label="Full width — edge to edge, no rounded corners" checked={data.fullWidth} onChange={(fullWidth) => set({ fullWidth })} />
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Banner Content</p>
        <TextField label="Eyebrow" value={data.eyebrow ?? ""} onChange={(eyebrow) => set({ eyebrow })} dir={dir} />
        <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => set({ heading })} dir={dir} />
        <TextareaField label="Text" value={data.body ?? ""} onChange={(body) => set({ body })} dir={dir} rows={3} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Primary CTA label" value={data.ctaLabel ?? ""} onChange={(ctaLabel) => set({ ctaLabel })} dir={dir} />
          <TextField label="Primary CTA URL" value={data.ctaUrl ?? ""} onChange={(ctaUrl) => set({ ctaUrl })} />
        </div>
        <SelectField label="Primary CTA style" value={data.ctaStyle} onChange={(ctaStyle) => set({ ctaStyle })} options={CTA_STYLE_OPTIONS} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Secondary CTA label" value={data.ctaLabel2 ?? ""} onChange={(ctaLabel2) => set({ ctaLabel2 })} dir={dir} />
          <TextField label="Secondary CTA URL" value={data.ctaUrl2 ?? ""} onChange={(ctaUrl2) => set({ ctaUrl2 })} />
        </div>
        <SelectField label="Secondary CTA style" value={data.ctaStyle2} onChange={(ctaStyle2) => set({ ctaStyle2 })} options={CTA_STYLE_OPTIONS} />
      </div>
    </div>
  );
}

export function BannerRender({ data, locale }: BlockRenderProps<BannerData>) {
  const isRtl = locale === "ar";
  const showBackground = data.layout !== "text";
  const bgImage = showBackground && data.backgroundType === "image" ? data.backgroundImage : null;
  const bgImageMobile = bgImage ? (data.backgroundImageMobile ?? bgImage) : null;
  const bgVideo = showBackground && data.backgroundType === "video" ? data.backgroundVideo : null;
  const hasBackground = Boolean(bgImage?.url || bgVideo?.url);
  const sideImage = data.layout === "split" ? data.image : null;

  const fit = heroImageFitClass(data.imageFit);
  const desktopPos: React.CSSProperties = { objectPosition: `${data.focalX}% ${data.focalY}%` };
  const mobilePos: React.CSSProperties = { objectPosition: `${data.focalXMobile ?? data.focalX}% ${data.focalYMobile ?? data.focalY}%` };

  const gradient = hasBackground ? resolveOverlayGradient(data.overlay, data.contentPosition, data.overlayOpacity, isRtl) : null;
  const textColor = data.textColorMode === "dark" ? "text-ink" : data.textColorMode === "light" || hasBackground ? "text-paper" : "";

  const heightClass = `${HEIGHT_CLASSES[data.height]} ${data.heightMobile ? MOBILE_HEIGHT_CLASSES[data.heightMobile] : ""}`;
  const heightStyle = data.height === "custom" && data.heightCustomValue ? ({ "--banner-h": data.heightCustomValue } as React.CSSProperties) : undefined;
  const shape = data.fullWidth ? "" : "rounded-[var(--card-radius-xl)]";

  const hasPrimary = Boolean(data.ctaLabel && data.ctaUrl);
  const hasSecondary = Boolean(data.ctaLabel2 && data.ctaUrl2);
  const ctaContext = { mediaId: "", component: "BANNER", locale };

  const text = (
    <Stagger className={`flex flex-col ${CONTENT_H[data.contentPosition]} ${CONTENT_MAX[data.contentMaxWidth]}`}>
      {data.eyebrow ? (
        <StaggerItem>
          <p className="manifest-strip mb-3 opacity-70">{data.eyebrow}</p>
        </StaggerItem>
      ) : null}
      {data.heading ? (
        <StaggerItem>
          <h2 className="font-display text-h1 leading-tight measure-ar">{data.heading}</h2>
        </StaggerItem>
      ) : null}
      {data.body ? (
        <StaggerItem>
          <p className="measure-ar mt-4 text-base leading-relaxed opacity-80 sm:text-lg">{data.body}</p>
        </StaggerItem>
      ) : null}
      {hasPrimary || hasSecondary ? (
        <StaggerItem>
          <div className={`mt-8 flex flex-wrap items-center gap-3 ${data.contentPosition === "center" ? "justify-center" : ""}`}>
            {hasPrimary ? (
              <Link href={resolveHref(data.ctaUrl ?? "", locale)} className={buttonClasses(heroButtonVariant(data.ctaStyle), "lg")}>
                {data.ctaLabel}
              </Link>
            ) : null}
            {hasSecondary ? (
              <Link href={resolveHref(data.ctaUrl2 ?? "", locale)} className={buttonClasses(heroButtonVariant(data.ctaStyle2), "lg")}>
                {data.ctaLabel2}
              </Link>
            ) : null}
          </div>
        </StaggerItem>
      ) : null}
    </Stagger>
  );

  const backgroundLayer = hasBackground ? (
    <HeroMediaMotion animation={data.animation} className="absolute inset-0 -z-10 overflow-hidden">
      {bgVideo?.url ? (
        <HeroVideoLayer src={bgVideo.url} poster={data.videoPoster?.url} autoPlay muted loop className={`h-full w-full ${fit}`} style={desktopPos} />
      ) : bgImage?.url ? (
        <>
          <CmsFillImage src={bgImage.url} alt="" sizes="100vw" className={`hidden sm:block ${fit}`} style={desktopPos} context={{ ...ctaContext, mediaId: bgImage.id }} />
          <CmsFillImage src={bgImageMobile!.url} alt="" sizes="100vw" className={`block sm:hidden ${fit}`} style={mobilePos} context={{ ...ctaContext, mediaId: bgImageMobile!.id }} />
        </>
      ) : null}
    </HeroMediaMotion>
  ) : null;

  const pad = "px-6 py-12 sm:px-10 sm:py-16 lg:px-16";

  return (
    <div
      className={`relative isolate flex w-full overflow-hidden ${shape} ${heightClass} ${textColor}`}
      style={heightStyle}
      data-banner-layout={data.layout}
    >
      {backgroundLayer}
      {gradient ? <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ backgroundImage: gradient }} /> : null}

      {data.layout === "split" ? (
        <div className={`mx-auto grid w-full max-w-[1400px] items-center gap-10 lg:grid-cols-2 lg:gap-16 ${pad}`}>
          {/* Grid tracks follow the document direction, so "start"/"end" mirror under RTL on their own. */}
          {sideImage?.url ? (
            <HeroMediaMotion
              animation={hasBackground ? "none" : data.animation}
              className={`relative aspect-[4/3] w-full overflow-hidden rounded-[var(--image-radius-lg)] ${data.imageSide === "end" ? "lg:order-2" : ""}`}
            >
              <CmsFillImage src={sideImage.url} alt="" sizes="(min-width: 1024px) 50vw, 100vw" className={`hidden sm:block ${fit}`} style={desktopPos} context={{ ...ctaContext, mediaId: sideImage.id }} />
              <CmsFillImage src={sideImage.url} alt="" sizes="100vw" className={`block sm:hidden ${fit}`} style={mobilePos} context={{ ...ctaContext, mediaId: sideImage.id }} />
            </HeroMediaMotion>
          ) : null}
          <div className={`flex h-full flex-col ${CONTENT_V[data.verticalAlign]} ${CONTENT_H[data.contentPosition]}`}>{text}</div>
        </div>
      ) : (
        <div className={`mx-auto flex w-full max-w-[1400px] flex-col ${CONTENT_V[data.verticalAlign]} ${CONTENT_H[data.contentPosition]} ${pad}`}>{text}</div>
      )}
    </div>
  );
}
