import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { MediaType } from "@prisma/client";

// Extension is derived from the validated MIME type, never from the client-supplied
// filename, so a malicious extension in the original name can't reach the filesystem.
const ALLOWED_MIME_TYPES: Record<string, { ext: string; type: MediaType; maxBytes: number }> = {
  "image/jpeg": { ext: "jpg", type: "IMAGE", maxBytes: 5 * 1024 * 1024 },
  "image/png": { ext: "png", type: "IMAGE", maxBytes: 5 * 1024 * 1024 },
  "image/webp": { ext: "webp", type: "IMAGE", maxBytes: 5 * 1024 * 1024 },
  "application/pdf": { ext: "pdf", type: "DOCUMENT", maxBytes: 10 * 1024 * 1024 },
};

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

export interface SavedFile {
  fileName: string;
  url: string;
  mimeType: string;
  type: MediaType;
  sizeBytes: number;
}

export class MediaUploadError extends Error {}

export async function saveUploadedFile(file: File): Promise<SavedFile> {
  const rule = ALLOWED_MIME_TYPES[file.type];
  if (!rule) {
    throw new MediaUploadError(`Unsupported file type: ${file.type || "unknown"}`);
  }
  if (file.size > rule.maxBytes) {
    throw new MediaUploadError(`File exceeds the ${Math.round(rule.maxBytes / 1024 / 1024)}MB limit.`);
  }
  if (file.size === 0) {
    throw new MediaUploadError("File is empty.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const now = new Date();
  const subDir = path.join(String(now.getUTCFullYear()), String(now.getUTCMonth() + 1).padStart(2, "0"));
  const targetDir = path.join(UPLOAD_ROOT, subDir);
  await mkdir(targetDir, { recursive: true });

  const fileName = `${randomUUID()}.${rule.ext}`;
  const targetPath = path.join(targetDir, fileName);
  await writeFile(targetPath, buffer);

  const url = `/uploads/${subDir.replace(/\\/g, "/")}/${fileName}`;

  return { fileName, url, mimeType: file.type, type: rule.type, sizeBytes: file.size };
}
