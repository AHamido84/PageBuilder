"use client";

import Link from "next/link";
import Image from "next/image";
import { TextField, TextareaField } from "@/components/admin/ui/field";
import { cn } from "@/lib/cn";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import type { G7AboutData, G7HeroData } from "./schema";
import { G7Arrow, G7ImageField, G7PositionFields, g7GoldButton, g7H2, g7Href, g7OffsetStyle, g7OutlineButton, g7OverlayClasses } from "./shared";

// Compact on desktop so both buttons fit side by side in the photo's dark half.
const heroButtonWidth = "min-w-[clamp(11rem,12.9vw,15.5rem)] xl:min-w-0 xl:gap-[0.9vw] xl:px-[1.3vw]";

/* 01 -- Hero: full-width photo with the text block in the photo's dark teal half. At lg+ the photo
 * is placed exactly as on the 1920x784 artboard (scaled 0.86, shifted -302/-28px); smaller tablets
 * use a plain cover crop and phones stack the photo over a teal text panel. The photo is not
 * mirrored for English (product packs would read backwards), so the text column stays on the
 * physical right in both languages and only its alignment follows dir. */
export function G7HeroRender({ data, locale }: BlockRenderProps<G7HeroData>) {
  const image = data.image?.url;
  const mobileImage = data.mobileImage?.url || image;
  const text = (
    <div className="text-[var(--g7-cream-50)]">
      {data.eyebrow ? <p className="t-h3 font-light text-[var(--g7-gold-500)]">{data.eyebrow}</p> : null}
      {/* Largest text on the page (finding 02). Arabic keeps its intentional 2-line break unwrapped. */}
      <h1 className="t-hero mt-[clamp(0.75rem,1.6vw,2rem)] xl:rtl:whitespace-nowrap">
        {data.headingLine1}
        {data.headingLine2 ? (
          <>
            <br />
            {data.headingLine2}
          </>
        ) : null}
      </h1>
      <div className={cn("mt-[clamp(1.75rem,2.6vw,3.6rem)] flex flex-wrap gap-[clamp(0.75rem,1.2vw,1.5rem)]", data.textX === "center" && "xl:justify-center")}>
        {data.primaryLabel ? (
          <Link href={g7Href(data.primaryUrl ?? "", locale)} className={cn(g7GoldButton, heroButtonWidth)}>
            {data.primaryLabel}
            <G7Arrow />
          </Link>
        ) : null}
        {data.secondaryLabel ? (
          <Link href={g7Href(data.secondaryUrl ?? "", locale)} className={cn(g7OutlineButton, heroButtonWidth)}>
            {data.secondaryLabel}
            <G7Arrow />
          </Link>
        ) : null}
      </div>
      {data.caption ? <p className="t-small mt-[clamp(1.25rem,1.8vw,2.4rem)] font-light">{data.caption}</p> : null}
    </div>
  );

  // One photo and one text block for every breakpoint (a single priority image, a single h1).
  // Below xl: photo on top, text on solid teal below. xl+: the photo is placed as on the artboard
  // and the text is overlaid on its dark half.
  const separateMobile = Boolean(data.mobileImage?.url && data.mobileImage.url !== image);
  const desktopPlacement = "xl:inset-auto xl:left-[-15.7%] xl:top-[-3.6%] xl:h-auto xl:w-[119.7%] xl:max-w-none xl:object-fill";
  return (
    <section className="relative bg-[var(--g7-teal-hero)]" aria-label={data.eyebrow || undefined}>
      <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/7] xl:aspect-[1920/784]">
        {separateMobile ? (
          <Image src={mobileImage!} alt={data.imageAlt ?? ""} fill priority sizes="100vw" className="object-cover object-[38%_50%] sm:object-[20%_50%] xl:hidden" />
        ) : null}
        {image ? (
          <Image
            src={image}
            alt={data.imageAlt ?? ""}
            width={2673}
            height={971}
            priority
            sizes="(min-width: 1280px) 120vw, 100vw"
            className={cn("absolute inset-0 h-full w-full object-cover object-[38%_50%] sm:object-[20%_50%]", desktopPlacement, separateMobile && "hidden xl:block")}
          />
        ) : null}
      </div>
      {/* dir="ltr" so the position presets mean physical sides of the photo; the text keeps the page dir. */}
      <div
        dir="ltr"
        className={cn("g7-container bg-[var(--g7-teal-900)] py-10 sm:py-14 xl:absolute xl:inset-0 xl:flex xl:bg-transparent xl:px-[3.5vw] xl:pb-[7vw] xl:pt-[3vw]", g7OverlayClasses(data.textX, data.textY, "xl"))}
      >
        <div dir={locale === "ar" ? "rtl" : "ltr"} className="g7-nudge-xl xl:w-max xl:max-w-[32vw] xl:ltr:max-w-[40vw]" style={g7OffsetStyle(data.offsetX, data.offsetY)}>
          {text}
        </div>
      </div>
    </section>
  );
}

export function G7HeroEdit({ data, onChange, locale }: BlockEditProps<G7HeroData>) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const set = <K extends keyof G7HeroData>(key: K) => (value: G7HeroData[K]) => onChange({ ...data, [key]: value });
  return (
    <div className="space-y-3">
      <G7ImageField label="Image (desktop)" value={data.image} onChange={set("image")} />
      <G7ImageField label="Image (mobile, optional)" value={data.mobileImage} onChange={set("mobileImage")} />
      <TextField label="Image alt text" value={data.imageAlt ?? ""} onChange={set("imageAlt")} dir={dir} />
      <TextField label="Eyebrow" value={data.eyebrow ?? ""} onChange={set("eyebrow")} dir={dir} />
      <TextField label="Heading line 1" value={data.headingLine1 ?? ""} onChange={set("headingLine1")} dir={dir} />
      <TextField label="Heading line 2" value={data.headingLine2 ?? ""} onChange={set("headingLine2")} dir={dir} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Primary button" value={data.primaryLabel ?? ""} onChange={set("primaryLabel")} dir={dir} />
        <TextField label="Primary URL" value={data.primaryUrl ?? ""} onChange={set("primaryUrl")} />
        <TextField label="Secondary button" value={data.secondaryLabel ?? ""} onChange={set("secondaryLabel")} dir={dir} />
        <TextField label="Secondary URL" value={data.secondaryUrl ?? ""} onChange={set("secondaryUrl")} />
      </div>
      <TextField label="Caption" value={data.caption ?? ""} onChange={set("caption")} dir={dir} />
      <G7PositionFields
        x={data.textX}
        y={data.textY}
        offsetX={data.offsetX}
        offsetY={data.offsetY}
        onChange={(p) => onChange({ ...data, textX: p.x, textY: p.y, offsetX: p.offsetX, offsetY: p.offsetY })}
        note="Applies on desktop (1280px+). Phones and tablets show the text under the photo."
      />
    </div>
  );
}

/* 02 -- About strip. */
export function G7AboutRender({ data }: BlockRenderProps<G7AboutData>) {
  return (
    <section className="bg-[var(--g7-cream-50)] pb-[clamp(3.5rem,8vw,9.5rem)] pt-[clamp(3rem,4.7vw,5.6rem)]">
      <div className="g7-container">
        {/* Section H2 scale with a short measure, so it reads as two balanced lines (finding 03). */}
        {data.heading ? <h2 className={cn(g7H2, "max-w-[13em] text-balance text-[var(--g7-teal-900)]")}>{data.heading}</h2> : null}
        {data.body ? <p className="t-p mt-[clamp(1.25rem,2.4vw,3rem)] max-w-[65ch] text-[var(--g7-muted)]">{data.body}</p> : null}
      </div>
    </section>
  );
}

export function G7AboutEdit({ data, onChange, locale }: BlockEditProps<G7AboutData>) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <div className="space-y-3">
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={dir} />
      <TextareaField label="Text" rows={4} value={data.body ?? ""} onChange={(body) => onChange({ ...data, body })} dir={dir} />
    </div>
  );
}
