"use client";

import { Plus, Trash2 } from "lucide-react";
import { TextField } from "@/components/admin/ui/field";
import { MediaPickerControlled } from "@/components/admin/ui/media-picker-field";
import { IconButton } from "@/components/admin/ui/icon-button";
import { CmsImage } from "@/components/media/cms-image";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import { resolveColumnsClasses } from "../../style-tokens";
import type { LogoCloudData } from "../media-blocks";

export function LogoCloudEdit({ data, onChange, locale }: BlockEditProps<LogoCloudData>) {
  return (
    <div className="space-y-3">
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={locale === "ar" ? "rtl" : "ltr"} />
      <div className="space-y-2">
        {data.logos.map((logo, i) => (
          <div key={i} className="flex items-end gap-2 rounded-md border border-neutral-800 p-2">
            <MediaPickerControlled
              label={`Logo ${i + 1}`}
              mediaId={logo.id}
              previewUrl={logo.url}
              onChange={(id, url) => {
                const next = [...data.logos];
                if (id) next[i] = { id, url };
                onChange({ ...data, logos: next });
              }}
            />
            <IconButton icon={Trash2} label="Remove" danger onClick={() => onChange({ ...data, logos: data.logos.filter((_, idx) => idx !== i) })} />
          </div>
        ))}
        {data.logos.length < 20 ? (
          <button
            type="button"
            onClick={() => onChange({ ...data, logos: [...data.logos, { id: "", url: "" }] })}
            className="flex items-center gap-1.5 rounded-md border border-dashed border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
          >
            <Plus size={14} /> Add logo
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function LogoCloudRender({ data, settings, locale }: BlockRenderProps<LogoCloudData>) {
  const logos = data.logos.filter((l) => l.url);
  return (
    <div>
      {data.heading ? <h2 className="mb-6 text-center font-display text-2xl">{data.heading}</h2> : null}
      <div className={`grid items-center gap-8 ${resolveColumnsClasses(settings)}`}>
        {logos.map((logo) => (
          <CmsImage
            key={logo.id}
            src={logo.url}
            alt=""
            className="mx-auto h-10 w-auto object-contain opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0"
            fallbackClassName="min-h-10"
            context={{ mediaId: logo.id, component: "LOGO_CLOUD", locale }}
          />
        ))}
      </div>
    </div>
  );
}
