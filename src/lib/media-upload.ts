import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import sanitizeHtml from "sanitize-html";
import type { MediaType } from "@prisma/client";

// Extension is derived from the validated MIME type, never from the client-supplied
// filename, so a malicious extension in the original name can't reach the filesystem.
const ALLOWED_MIME_TYPES: Record<string, { ext: string; type: MediaType; maxBytes: number }> = {
  "image/jpeg": { ext: "jpg", type: "IMAGE", maxBytes: 5 * 1024 * 1024 },
  "image/png": { ext: "png", type: "IMAGE", maxBytes: 5 * 1024 * 1024 },
  "image/webp": { ext: "webp", type: "IMAGE", maxBytes: 5 * 1024 * 1024 },
  "image/svg+xml": { ext: "svg", type: "IMAGE", maxBytes: 1 * 1024 * 1024 },
  "application/pdf": { ext: "pdf", type: "DOCUMENT", maxBytes: 10 * 1024 * 1024 },
  "video/mp4": { ext: "mp4", type: "VIDEO", maxBytes: 50 * 1024 * 1024 },
  "video/webm": { ext: "webm", type: "VIDEO", maxBytes: 50 * 1024 * 1024 },
};

const RASTER_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_DIMENSION = 2000;

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

export interface SavedFile {
  fileName: string;
  url: string;
  mimeType: string;
  type: MediaType;
  sizeBytes: number;
  width: number | null;
  height: number | null;
}

export class MediaUploadError extends Error {}

// Explicit allowlist, NOT `allowedAttributes: false` -- that means "allow every
// attribute", which lets onload/onclick/etc. straight through. Every attribute
// name below is a presentation/geometry attribute; none of them execute script.
const SVG_SAFE_ATTRIBUTES = [
  "id", "class", "viewBox", "width", "height", "xmlns", "xmlns:xlink", "version", "preserveAspectRatio",
  "d", "cx", "cy", "r", "rx", "ry", "x", "y", "x1", "y1", "x2", "y2", "points", "transform",
  "fill", "fill-rule", "fill-opacity", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin",
  "stroke-dasharray", "stroke-opacity", "opacity", "offset", "stop-color", "stop-opacity",
  "gradientUnits", "gradientTransform", "clip-path", "clipPathUnits", "xlink:href", "href",
];

/** Strips <script>, event-handler attributes, and external references from SVG XML before it's stored -- SVG can carry executable script content, unlike raster formats. */
function sanitizeSvg(svg: string): string {
  return sanitizeHtml(svg, {
    allowedTags: [
      "svg", "g", "path", "circle", "rect", "ellipse", "line", "polyline", "polygon",
      "defs", "clipPath", "linearGradient", "radialGradient", "stop", "title", "desc", "use", "symbol",
    ],
    allowedAttributes: { "*": SVG_SAFE_ATTRIBUTES },
    allowedSchemes: ["data"],
    disallowedTagsMode: "discard",
    exclusiveFilter: (frame) => frame.tag === "script" || frame.tag === "foreignobject",
  });
}

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

  let buffer = Buffer.from(await file.arrayBuffer());
  let width: number | null = null;
  let height: number | null = null;

  if (file.type === "image/svg+xml") {
    const sanitized = sanitizeSvg(buffer.toString("utf-8"));
    buffer = Buffer.from(sanitized, "utf-8");
  } else if (RASTER_MIME_TYPES.has(file.type)) {
    const image = sharp(buffer, { failOn: "error" });
    const metadata = await image.metadata();
    if (metadata.width && metadata.height) {
      if (metadata.width > MAX_DIMENSION) {
        image.resize({ width: MAX_DIMENSION, withoutEnlargement: true });
      }
      if (file.type === "image/jpeg") image.jpeg({ quality: 82, mozjpeg: true });
      else if (file.type === "image/png") image.png({ quality: 82 });
      else if (file.type === "image/webp") image.webp({ quality: 82 });

      buffer = await image.toBuffer();
      const finalMeta = await sharp(buffer).metadata();
      width = finalMeta.width ?? metadata.width;
      height = finalMeta.height ?? metadata.height;
    }
  }

  const now = new Date();
  const subDir = path.join(String(now.getUTCFullYear()), String(now.getUTCMonth() + 1).padStart(2, "0"));
  const targetDir = path.join(UPLOAD_ROOT, subDir);
  await mkdir(targetDir, { recursive: true });

  const fileName = `${randomUUID()}.${rule.ext}`;
  const targetPath = path.join(targetDir, fileName);
  await writeFile(targetPath, buffer);

  const url = `/uploads/${subDir.replace(/\\/g, "/")}/${fileName}`;

  return { fileName, url, mimeType: file.type, type: rule.type, sizeBytes: buffer.byteLength, width, height };
}

/** Deletes a previously uploaded file given its public URL. Safe to call even if the file is already gone. */
export async function deleteUploadedFile(url: string): Promise<void> {
  if (!url.startsWith("/uploads/")) return;
  const relativePath = url.replace(/^\/uploads\//, "");
  const targetPath = path.join(UPLOAD_ROOT, relativePath);
  try {
    await unlink(targetPath);
  } catch {
    // Already gone or never existed on disk — nothing to do.
  }
}
