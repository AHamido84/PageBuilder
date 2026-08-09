"use client";

import { TextField, NumberField } from "@/components/admin/ui/field";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import type { MapData } from "../misc-blocks";

export function MapEdit({ data, onChange }: BlockEditProps<MapData>) {
  return (
    <div className="space-y-3">
      <TextField label="Address" value={data.address} onChange={(address) => onChange({ ...data, address })} placeholder="Jeddah, Saudi Arabia" />
      <NumberField label="Zoom (1-20)" value={data.zoom} min={1} max={20} onChange={(zoom) => onChange({ ...data, zoom })} />
    </div>
  );
}

export function MapRender({ data }: BlockRenderProps<MapData>) {
  if (!data.address) return null;
  const src = `https://www.google.com/maps?q=${encodeURIComponent(data.address)}&z=${data.zoom || 14}&output=embed`;
  return (
    <div className="aspect-video w-full overflow-hidden rounded-[var(--radius-md)]">
      <iframe src={src} className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Map" />
    </div>
  );
}
