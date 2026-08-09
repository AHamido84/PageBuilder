"use client";

import { AtSign, Briefcase, Camera, Globe, Play, Plus, Share2, Trash2 } from "lucide-react";
import { SelectField, TextField } from "@/components/admin/ui/field";
import { IconButton } from "@/components/admin/ui/icon-button";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import type { SocialMediaData } from "../misc-blocks";

// lucide-react dropped trademarked brand marks -- generic stand-ins per platform.
const PLATFORM_ICON: Record<string, typeof Globe> = {
  facebook: Share2, instagram: Camera, twitter: AtSign, linkedin: Briefcase, youtube: Play, other: Globe,
};
const PLATFORM_OPTIONS = Object.keys(PLATFORM_ICON);

export function SocialMediaEdit({ data, onChange, locale }: BlockEditProps<SocialMediaData>) {
  const links = data.links;
  function setLinks(next: SocialMediaData["links"]) {
    onChange({ ...data, links: next });
  }
  return (
    <div className="space-y-3">
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={locale === "ar" ? "rtl" : "ltr"} />
      {links.map((link, i) => (
        <div key={i} className="flex items-end gap-2 rounded-md border border-neutral-800 p-2">
          <SelectField
            label="Platform"
            value={link.platform}
            onChange={(platform) => setLinks(links.map((l, idx) => (idx === i ? { ...l, platform } : l)))}
            options={PLATFORM_OPTIONS.map((p) => ({ value: p, label: p }))}
            className="w-32"
          />
          <TextField label="URL" value={link.url} onChange={(url) => setLinks(links.map((l, idx) => (idx === i ? { ...l, url } : l)))} className="flex-1" />
          <IconButton icon={Trash2} label="Remove" danger onClick={() => setLinks(links.filter((_, idx) => idx !== i))} />
        </div>
      ))}
      <button
        type="button"
        onClick={() => setLinks([...links, { platform: "facebook", url: "" }])}
        className="flex items-center gap-1.5 rounded-md border border-dashed border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
      >
        <Plus size={14} /> Add link
      </button>
    </div>
  );
}

export function SocialMediaRender({ data }: BlockRenderProps<SocialMediaData>) {
  const links = data.links.filter((l) => l.url);
  return (
    <div className="text-center">
      {data.heading ? <h2 className="mb-6 font-display text-2xl">{data.heading}</h2> : null}
      <div className="flex justify-center gap-4">
        {links.map((link, i) => {
          const Icon = PLATFORM_ICON[link.platform] ?? Globe;
          return (
            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-current/15 opacity-70 hover:opacity-100">
              <Icon size={18} />
            </a>
          );
        })}
      </div>
    </div>
  );
}
