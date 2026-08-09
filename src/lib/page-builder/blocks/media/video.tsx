"use client";

import { SegmentedControl } from "@/components/admin/ui/segmented-control";
import { TextField } from "@/components/admin/ui/field";
import { MediaPickerControlled } from "@/components/admin/ui/media-picker-field";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import type { VideoData } from "../media-blocks";

function toEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

export function VideoEdit({ data, onChange }: BlockEditProps<VideoData>) {
  return (
    <div className="space-y-3">
      <SegmentedControl
        value={data.mode}
        onChange={(mode) => onChange({ ...data, mode })}
        options={[
          { value: "embed", label: "YouTube / Vimeo" },
          { value: "upload", label: "Uploaded file" },
        ]}
      />
      {data.mode === "embed" ? (
        <TextField label="Video URL" value={data.embedUrl ?? ""} onChange={(embedUrl) => onChange({ ...data, embedUrl })} placeholder="https://youtube.com/watch?v=..." />
      ) : (
        <MediaPickerControlled label="Video file" mediaId={data.video?.id ?? ""} previewUrl={data.video?.url} onChange={(id, url) => onChange({ ...data, video: id ? { id, url } : null })} />
      )}
    </div>
  );
}

export function VideoRender({ data }: BlockRenderProps<VideoData>) {
  if (data.mode === "embed" && data.embedUrl) {
    const embed = toEmbedUrl(data.embedUrl);
    if (!embed) return null;
    return (
      <div className="aspect-video w-full overflow-hidden rounded-[var(--radius-md)]">
        <iframe src={embed} className="h-full w-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
      </div>
    );
  }
  if (data.mode === "upload" && data.video) {
    return (
      <video controls className="aspect-video w-full rounded-[var(--radius-md)] object-cover">
        <source src={data.video.url} />
      </video>
    );
  }
  return null;
}
