"use client";

import { FileText, Film } from "lucide-react";
import type { MediaItem } from "@/lib/media/upload-client";

/** Admin-only thumbnail. Plain lazy <img> on purpose: admin grids shouldn't spend the public site's image-optimization budget. */
export function MediaThumb({ item, className = "h-full w-full object-cover" }: { item: Pick<MediaItem, "type" | "url" | "altTextEn" | "originalName">; className?: string }) {
  if (item.type === "IMAGE") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.url} alt={item.altTextEn ?? ""} loading="lazy" decoding="async" className={className} />;
  }
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-neutral-500">
      {item.type === "VIDEO" ? <Film size={26} /> : <FileText size={26} />}
      <span className="text-[10px] uppercase tracking-wide">{item.type === "VIDEO" ? "Video" : "PDF"}</span>
    </div>
  );
}
