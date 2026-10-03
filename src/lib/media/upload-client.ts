"use client";

import { compressImageForUpload } from "@/lib/media/compress-image-client";

/** Shape returned by the admin media API (mirrors `mediaListSelect` in src/lib/media-library.ts, dates serialized). */
export interface MediaItem {
  id: string;
  url: string;
  fileName: string;
  originalName: string;
  title: string | null;
  description: string | null;
  type: "IMAGE" | "DOCUMENT" | "VIDEO";
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  altTextEn: string | null;
  altTextAr: string | null;
  tags: string[];
  folderId: string | null;
  createdAt: string;
}

export type MediaKind = MediaItem["type"];

export function acceptAttrFor(kind: MediaKind | "ANY"): string {
  if (kind === "IMAGE") return "image/jpeg,image/png,image/webp,image/svg+xml";
  if (kind === "VIDEO") return "video/mp4,video/webm";
  if (kind === "DOCUMENT") return "application/pdf";
  return "image/jpeg,image/png,image/webp,image/svg+xml,video/mp4,video/webm,application/pdf";
}

/** Client-side mirror of media-upload.ts's server rules -- rejects obvious mismatches before spending an upload. */
export function kindOfFile(file: File): MediaKind | null {
  if (["image/jpeg", "image/png", "image/webp", "image/svg+xml"].includes(file.type)) return "IMAGE";
  if (["video/mp4", "video/webm"].includes(file.type)) return "VIDEO";
  if (file.type === "application/pdf") return "DOCUMENT";
  return null;
}

/** Mirrors ALLOWED_MIME_TYPES maxBytes in src/lib/media-upload.ts (server stays the authority). */
const MAX_BYTES: Record<string, number> = {
  "image/jpeg": 5 * 1024 * 1024,
  "image/png": 5 * 1024 * 1024,
  "image/webp": 5 * 1024 * 1024,
  "image/svg+xml": 1 * 1024 * 1024,
  "application/pdf": 10 * 1024 * 1024,
  "video/mp4": 50 * 1024 * 1024,
  "video/webm": 50 * 1024 * 1024,
};

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface UploadOptions {
  folderId?: string | null;
  onProgress?: (fraction: number) => void;
  /** POST target -- defaults to a new upload; `/api/admin/media/<id>/replace` swaps an existing file. */
  endpoint?: string;
}

/**
 * Single upload path for every admin surface (library page, picker modal, product media).
 * Uses XMLHttpRequest rather than fetch because only XHR reports upload progress. Images are
 * downscaled client-side first (see compress-image-client.ts -- Vercel's ~4.5MB request limit).
 */
export async function uploadMediaFile(rawFile: File, { folderId, onProgress, endpoint = "/api/admin/media" }: UploadOptions = {}): Promise<MediaItem> {
  if (!kindOfFile(rawFile)) throw new Error(`Unsupported file type (${rawFile.type || "unknown"}).`);
  const file = await compressImageForUpload(rawFile);
  const limit = MAX_BYTES[file.type];
  if (limit && file.size > limit) throw new Error(`File is ${formatBytes(file.size)} -- the limit for this type is ${formatBytes(limit)}.`);
  const body = new FormData();
  body.set("file", file);
  if (folderId) body.set("folderId", folderId);

  return new Promise<MediaItem>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    xhr.onload = () => {
      // A request Vercel's platform itself rejects for size (HTTP 413) comes back as plain text, not JSON.
      let json: { media?: MediaItem; error?: string } | null = null;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        json = null;
      }
      if (xhr.status >= 200 && xhr.status < 300 && json?.media) {
        onProgress?.(1);
        resolve(json.media);
      } else {
        reject(new Error(json?.error ?? (xhr.status === 413 ? "File is too large for the server (HTTP 413)." : `Upload failed (HTTP ${xhr.status}).`)));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(body);
  });
}

export interface FolderOption {
  id: string;
  name: string;
  count: number;
}

export interface FolderListResponse {
  folders: FolderOption[];
  unfiledCount: number;
  totalCount: number;
}

export async function fetchFolders(): Promise<FolderListResponse> {
  const res = await fetch("/api/admin/media/folders");
  if (!res.ok) throw new Error(`Couldn't load folders (HTTP ${res.status}).`);
  return res.json();
}

/** Resolves a folder name (e.g. "Brands") to its id, for pickers that suggest an upload destination. */
export function folderIdByName(folders: FolderOption[], name: string | undefined): string | null {
  if (!name) return null;
  return folders.find((f) => f.name.toLowerCase() === name.toLowerCase())?.id ?? null;
}
