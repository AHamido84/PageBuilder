"use client";

const MAX_DIMENSION = 2000; // matches media-upload.ts's server-side sharp cap -- no point sending more than the server will keep
const JPEG_QUALITY = 0.85;

function hasTransparency(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  const { data } = ctx.getImageData(0, 0, width, height);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true;
  }
  return false;
}

/**
 * Downscales/recompresses an oversized image client-side before upload. Root-cause fix for large
 * photo uploads failing with an opaque HTTP 413: Vercel's serverless functions enforce a hard
 * ~4.5MB request-body limit that isn't configurable, so a big source photo gets rejected by the
 * platform before this app's own code (media-upload.ts's validation/magic-byte checks/sharp
 * resizing) ever runs. This only needs to get the request comfortably under that ceiling -- the
 * server-side pipeline is untouched and still runs on whatever this produces.
 *
 * Skips SVGs (vector, no size benefit) and anything already under `maxBytes`. A PNG that actually
 * uses transparency is resized but kept lossless PNG -- re-encoding it as JPEG would bake in a
 * black/white background. Everything else converts to JPEG, which compresses photographic content
 * far better than PNG (the actual reason a large PNG photo fails where a similarly-sized JPEG
 * often wouldn't).
 */
export async function compressImageForUpload(file: File, maxBytes = 4 * 1024 * 1024): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;
  if (file.size <= maxBytes) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // let the server reject it with a real error rather than fail silently here
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const transparent = file.type === "image/png" && hasTransparency(ctx, width, height);
  const outputType = transparent ? "image/png" : "image/jpeg";
  const outputExt = transparent ? "png" : "jpg";

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outputType, JPEG_QUALITY));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, `.${outputExt}`), { type: outputType });
}
