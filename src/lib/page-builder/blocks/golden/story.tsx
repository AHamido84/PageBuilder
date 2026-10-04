"use client";

import Image from "next/image";
import { TextField, TextareaField } from "@/components/admin/ui/field";
import { cn } from "@/lib/cn";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import type { G7BannerData, G7SectorsData, G7StepsData, G7TitledItem } from "./schema";
import { G7ImageField, G7ListEditor, G7PositionFields, g7Eyebrow, g7OffsetStyle, g7OverlayClasses } from "./shared";

/* 06 -- Lifestyle banner: full-bleed photo (1920x640, same ratio as the image) whose right half
 * fades into teal; text sits there. Like the hero, the photo isn't mirrored for English, so the
 * text stays on the physical right. */
export function G7BannerRender({ data, locale }: BlockRenderProps<G7BannerData>) {
  const image = data.image?.url;
  const mobileImage = data.mobileImage?.url || image;
  const text = (
    <div className="text-[var(--g7-cream-50)]">
      {data.eyebrow ? <p className={g7Eyebrow}>{data.eyebrow}</p> : null}
      <h2 className="t-h2 mt-[clamp(0.75rem,1.8vw,2.2rem)]">
        {data.headingLine1}
        {data.headingLine2 ? (
          <>
            <br />
            {data.headingLine2}
          </>
        ) : null}
      </h2>
      {data.body ? <p className="t-p mt-[clamp(1rem,1.8vw,2.2rem)] max-w-[25rem] font-light lg:max-w-[25vw]">{data.body}</p> : null}
    </div>
  );
  return (
    <section className="bg-[var(--g7-teal-900)]">
      <div className="md:hidden">
        {mobileImage ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <Image src={mobileImage} alt={data.imageAlt ?? ""} fill sizes="100vw" className="object-cover object-[22%_50%]" />
          </div>
        ) : null}
        <div className="px-4 py-12 sm:px-6">{text}</div>
      </div>
      <div className="relative hidden aspect-[1920/640] min-h-[24rem] w-full overflow-hidden md:block">
        {image ? <Image src={image} alt={data.imageAlt ?? ""} fill sizes="100vw" className="object-cover object-left" /> : null}
        {/* dir="ltr" so the position presets mean physical sides of the photo; the text keeps the page dir. */}
        <div dir="ltr" className={cn("g7-container relative flex h-full py-[3vw]", g7OverlayClasses(data.textX, data.textY))}>
          <div dir={locale === "ar" ? "rtl" : "ltr"} className="g7-nudge w-[min(26rem,48%)] lg:w-[31vw] lg:max-w-[37rem]" style={g7OffsetStyle(data.offsetX, data.offsetY)}>
            {text}
          </div>
        </div>
      </div>
    </section>
  );
}

export function G7BannerEdit({ data, onChange, locale }: BlockEditProps<G7BannerData>) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const set = <K extends keyof G7BannerData>(key: K) => (value: G7BannerData[K]) => onChange({ ...data, [key]: value });
  return (
    <div className="space-y-3">
      <G7ImageField label="Image (desktop)" value={data.image} onChange={set("image")} />
      <G7ImageField label="Image (mobile, optional)" value={data.mobileImage} onChange={set("mobileImage")} />
      <TextField label="Image alt text" value={data.imageAlt ?? ""} onChange={set("imageAlt")} dir={dir} />
      <TextField label="Eyebrow" value={data.eyebrow ?? ""} onChange={set("eyebrow")} dir={dir} />
      <TextField label="Heading line 1" value={data.headingLine1 ?? ""} onChange={set("headingLine1")} dir={dir} />
      <TextField label="Heading line 2" value={data.headingLine2 ?? ""} onChange={set("headingLine2")} dir={dir} />
      <TextareaField label="Text" rows={3} value={data.body ?? ""} onChange={set("body")} dir={dir} />
      <G7PositionFields
        x={data.textX}
        y={data.textY}
        offsetX={data.offsetX}
        offsetY={data.offsetY}
        onChange={(p) => onChange({ ...data, textX: p.x, textY: p.y, offsetX: p.offsetX, offsetY: p.offsetY })}
        note="Applies from tablet width (768px+). Phones show the text under the photo."
      />
    </div>
  );
}

/* Shared 3-column layout of sections 07 and 08: columns 500px wide with 65px gaps on the artboard. */
const columns = "grid grid-cols-1 gap-x-[clamp(1.5rem,3.4vw,4.1rem)] gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:pe-[clamp(0rem,1.7vw,2rem)]";

/* 07 -- Why us: three numbered columns. The numbers use Lama Sans ExtraBold (The Year of The Camel
 * isn't available) in Latin digits, as in the design. */
export function G7StepsRender({ data }: BlockRenderProps<G7StepsData>) {
  const items = data.items ?? [];
  return (
    <section className="bg-[var(--g7-cream-50)] pb-[clamp(3.5rem,5.7vw,6.9rem)] pt-[clamp(3.5rem,6vw,7.2rem)]">
      <div className="g7-container">
        {data.heading ? <h2 className="t-h2 text-[var(--g7-teal-900)]">{data.heading}</h2> : null}
        {data.subtitle ? <p className="t-p mt-[clamp(0.75rem,1.1vw,1.3rem)] font-light text-[var(--g7-muted)]">{data.subtitle}</p> : null}
        <ol className={cn(columns, "mt-[clamp(2.5rem,4.5vw,5.4rem)]")}>
          {items.map((item, i) => (
            <li key={i}>
              <span aria-hidden="true" className="block px-[clamp(0rem,1vw,1.25rem)] text-[length:var(--fs-h2)] font-extrabold leading-none text-[var(--g7-gold-500)]">
                {i + 1}
              </span>
              <div className="mt-[clamp(1.25rem,2.4vw,2.9rem)] border-t border-[var(--g7-divider)] pt-[clamp(1.25rem,1.9vw,2.25rem)]">
                <h3 className="t-h3 text-[var(--g7-teal-900)]">{item.title}</h3>
                {item.body ? <p className="t-p mt-[clamp(0.75rem,1.6vw,2rem)] max-w-[20em] font-light text-[var(--g7-muted)]">{item.body}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* 08 -- Business sectors (dark teal). */
export function G7SectorsRender({ data }: BlockRenderProps<G7SectorsData>) {
  const items = data.items ?? [];
  return (
    <section className="bg-[var(--g7-teal-800)] pb-[clamp(3.5rem,6.8vw,8.1rem)] pt-[clamp(3rem,4vw,4.8rem)]">
      <div className="g7-container">
        {data.eyebrow ? <p className={g7Eyebrow}>{data.eyebrow}</p> : null}
        {data.heading ? <h2 className="t-h2 mt-[clamp(0.75rem,1.7vw,2rem)] text-[var(--g7-cream-50)]">{data.heading}</h2> : null}
        <div className={cn(columns, "mt-[clamp(2rem,4.2vw,5rem)]")}>
          {items.map((item, i) => (
            <div key={i} className="border-t border-[var(--g7-divider-on-teal)] pt-[clamp(1.5rem,2.2vw,2.6rem)]">
              <h3 className="t-h3 text-[var(--g7-cream-50)]">{item.title}</h3>
              {item.body ? <p className="t-p mt-[clamp(0.75rem,1.6vw,2rem)] max-w-[18em] font-light text-[var(--g7-cream-50)]/90">{item.body}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TitledItemsEditor({ label, items, onChange, dir }: { label: string; items: G7TitledItem[]; onChange: (next: G7TitledItem[]) => void; dir: "rtl" | "ltr" }) {
  return (
    <G7ListEditor<G7TitledItem>
      label={label}
      items={items}
      max={6}
      onChange={onChange}
      createItem={() => ({ title: "", body: "" })}
      itemLabel={(item) => item.title ?? ""}
      renderItem={(item, update) => (
        <>
          <TextField label="Title" value={item.title ?? ""} onChange={(title) => update({ ...item, title })} dir={dir} />
          <TextareaField label="Text" rows={3} value={item.body ?? ""} onChange={(body) => update({ ...item, body })} dir={dir} />
        </>
      )}
    />
  );
}

export function G7StepsEdit({ data, onChange, locale }: BlockEditProps<G7StepsData>) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <div className="space-y-3">
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={dir} />
      <TextField label="Subtitle" value={data.subtitle ?? ""} onChange={(subtitle) => onChange({ ...data, subtitle })} dir={dir} />
      <TitledItemsEditor label="Steps (numbered automatically)" items={data.items ?? []} onChange={(items) => onChange({ ...data, items })} dir={dir} />
    </div>
  );
}

export function G7SectorsEdit({ data, onChange, locale }: BlockEditProps<G7SectorsData>) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <div className="space-y-3">
      <TextField label="Eyebrow" value={data.eyebrow ?? ""} onChange={(eyebrow) => onChange({ ...data, eyebrow })} dir={dir} />
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={dir} />
      <TitledItemsEditor label="Sectors" items={data.items ?? []} onChange={(items) => onChange({ ...data, items })} dir={dir} />
    </div>
  );
}
