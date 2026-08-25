"use client";

import { Plus, Trash2 } from "lucide-react";
import { TextField, SelectField, NumberField, CheckboxField } from "@/components/admin/ui/field";
import { MediaPickerControlled } from "@/components/admin/ui/media-picker-field";
import { IconButton } from "@/components/admin/ui/icon-button";
import { CmsImage } from "@/components/media/cms-image";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import { resolveColumnsClasses } from "../../style-tokens";
import type { LogoCloudData } from "../media-blocks";

const HOVER_ANIMATION_OPTIONS = [
  { value: "scale" as const, label: "Scale up" },
  { value: "lift" as const, label: "Lift" },
  { value: "grayscale-to-color" as const, label: "Grayscale → color" },
  { value: "none" as const, label: "None" },
];
const OBJECT_FIT_OPTIONS = [
  { value: "contain" as const, label: "Contain" },
  { value: "cover" as const, label: "Cover" },
];
const BACKGROUND_OPTIONS = [
  { value: "none" as const, label: "None" },
  { value: "paper" as const, label: "Paper" },
  { value: "frost" as const, label: "Frost" },
];

export function LogoCloudEdit({ data, onChange, locale }: BlockEditProps<LogoCloudData>) {
  return (
    <div className="space-y-4">
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={locale === "ar" ? "rtl" : "ltr"} />

      <div className="space-y-2">
        {data.logos.map((logo, i) => (
          <div key={i} className="space-y-2 rounded-md border border-neutral-800 p-2">
            <div className="flex items-end gap-2">
              <MediaPickerControlled
                label={`Logo ${i + 1}`}
                mediaId={logo.id}
                previewUrl={logo.url}
                onChange={(id, url) => {
                  const next = [...data.logos];
                  if (id) next[i] = { ...next[i], id, url };
                  onChange({ ...data, logos: next });
                }}
              />
              <IconButton icon={Trash2} label="Remove" danger onClick={() => onChange({ ...data, logos: data.logos.filter((_, idx) => idx !== i) })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <TextField
                label="Alt text"
                value={logo.alt ?? ""}
                onChange={(alt) => {
                  const next = [...data.logos];
                  next[i] = { ...next[i], alt };
                  onChange({ ...data, logos: next });
                }}
              />
              <TextField
                label="Link (optional)"
                value={logo.link ?? ""}
                placeholder="https://brand-site.com"
                onChange={(link) => {
                  const next = [...data.logos];
                  next[i] = { ...next[i], link };
                  onChange({ ...data, logos: next });
                }}
              />
            </div>
            {logo.link ? (
              <CheckboxField
                label="Open in new tab"
                checked={logo.openInNewTab ?? false}
                onChange={(openInNewTab) => {
                  const next = [...data.logos];
                  next[i] = { ...next[i], openInNewTab };
                  onChange({ ...data, logos: next });
                }}
              />
            ) : null}
          </div>
        ))}
        {data.logos.length < 20 ? (
          <button
            type="button"
            onClick={() => onChange({ ...data, logos: [...data.logos, { id: "", url: "", alt: "", link: "", openInNewTab: false }] })}
            className="flex items-center gap-1.5 rounded-md border border-dashed border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
          >
            <Plus size={14} /> Add logo
          </button>
        ) : null}
      </div>

      <div className="space-y-2 border-t border-neutral-800 pt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Appearance (applies to every logo)</p>
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Height (px)" value={data.height} min={16} max={200} onChange={(height) => onChange({ ...data, height })} />
          <NumberField label="Width (px, 0 = auto)" value={data.width} min={0} max={400} onChange={(width) => onChange({ ...data, width })} />
          <SelectField label="Object fit" value={data.objectFit} options={OBJECT_FIT_OPTIONS} onChange={(objectFit) => onChange({ ...data, objectFit })} />
          <NumberField label="Border radius (px)" value={data.borderRadius} min={0} max={48} onChange={(borderRadius) => onChange({ ...data, borderRadius })} />
          <NumberField label="Opacity (%)" value={data.opacity} min={0} max={100} onChange={(opacity) => onChange({ ...data, opacity })} />
          <NumberField label="Padding (px)" value={data.padding} min={0} max={48} onChange={(padding) => onChange({ ...data, padding })} />
          <SelectField label="Background" value={data.background} options={BACKGROUND_OPTIONS} onChange={(background) => onChange({ ...data, background })} />
          <SelectField label="Hover animation" value={data.hoverAnimation} options={HOVER_ANIMATION_OPTIONS} onChange={(hoverAnimation) => onChange({ ...data, hoverAnimation })} />
          {data.hoverAnimation === "scale" ? (
            <NumberField
              label="Hover scale (e.g. 1.06)"
              value={data.hoverScale}
              min={1}
              max={1.3}
              onChange={(hoverScale) => onChange({ ...data, hoverScale })}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

const BACKGROUND_CLASS: Record<LogoCloudData["background"], string> = { none: "", paper: "bg-paper", frost: "bg-frost" };
const HOVER_CLASS: Record<LogoCloudData["hoverAnimation"], string> = {
  none: "",
  scale: "transition-transform duration-300 hover:scale-[var(--logo-hover-scale)]",
  lift: "transition-transform duration-300 hover:-translate-y-1",
  "grayscale-to-color": "grayscale transition duration-300 hover:grayscale-0",
};

export function LogoCloudRender({ data, settings, locale }: BlockRenderProps<LogoCloudData>) {
  const logos = data.logos.filter((l) => l.url);
  const width = data.width > 0 ? `${data.width}px` : "auto";
  return (
    <div>
      {data.heading ? <h2 className="mb-6 text-center font-display text-2xl">{data.heading}</h2> : null}
      <div className={`grid items-center gap-8 ${resolveColumnsClasses(settings)}`}>
        {logos.map((logo) => {
          const img = (
            <CmsImage
              src={logo.url}
              alt={logo.alt || ""}
              className={`mx-auto object-${data.objectFit} ${HOVER_CLASS[data.hoverAnimation]} ${BACKGROUND_CLASS[data.background]}`}
              fallbackClassName="min-h-10"
              style={{
                height: `${data.height}px`,
                width,
                opacity: data.opacity / 100,
                borderRadius: `${data.borderRadius}px`,
                padding: `${data.padding}px`,
                "--logo-hover-scale": data.hoverScale,
              } as React.CSSProperties}
              context={{ mediaId: logo.id, component: "LOGO_CLOUD", locale }}
            />
          );
          return logo.link ? (
            <a
              key={logo.id}
              href={logo.link}
              target={logo.openInNewTab ? "_blank" : undefined}
              rel={logo.openInNewTab ? "noopener noreferrer" : undefined}
              className="mx-auto block"
              aria-label={logo.alt || undefined}
            >
              {img}
            </a>
          ) : (
            <span key={logo.id} className="mx-auto block">
              {img}
            </span>
          );
        })}
      </div>
    </div>
  );
}
