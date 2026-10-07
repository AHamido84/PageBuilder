/**
 * Generates the Golden Seven square brand icons from the logo (design-assets/logo/golden-seven-logo.png):
 *
 *   public/favicon.ico           16 + 32 + 48 px (PNG-encoded ICO)
 *   public/icon.png              512x512 (manifest, Organization logo)
 *   public/icon-192.png          192x192 (manifest)
 *   public/apple-touch-icon.png  180x180 (iOS home screen)
 *
 * The logo is a wide banner, so it is centred on a square brand-cream tile -- reads well on white
 * and on dark UIs. Re-run after a logo change:  npx tsx scripts/generate-brand-icons.ts [logo.png]
 */
import { writeFileSync } from "node:fs";
import sharp from "sharp";

const SOURCE = process.argv[2] ?? "design-assets/logo/golden-seven-logo.png";
const BACKGROUND = "#f7f0e6"; // --g7-cream-50

async function squareIcon(size: number): Promise<Buffer> {
  // Small sizes get less padding so the mark stays as large as possible.
  const inner = Math.round(size * (size <= 48 ? 0.96 : 0.86));
  const logo = await sharp(SOURCE).resize({ width: inner, height: inner, fit: "inside" }).png().toBuffer();
  const { width = inner, height = inner } = await sharp(logo).metadata();
  return sharp({ create: { width: size, height: size, channels: 4, background: BACKGROUND } })
    .composite([{ input: logo, left: Math.round((size - width) / 2), top: Math.round((size - height) / 2) }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** ICO container holding PNG images (supported by every current browser and by Google's crawler). */
function toIco(images: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  const entries: Buffer[] = [];
  let offset = 6 + 16 * images.length;
  for (const { size, png } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += png.length;
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.png)]);
}

async function main() {
  writeFileSync("public/icon.png", await squareIcon(512));
  writeFileSync("public/icon-192.png", await squareIcon(192));
  writeFileSync("public/apple-touch-icon.png", await squareIcon(180));
  const ico = await Promise.all([16, 32, 48].map(async (size) => ({ size, png: await squareIcon(size) })));
  writeFileSync("public/favicon.ico", toIco(ico));
  console.log("Wrote public/favicon.ico (16/32/48), icon.png (512), icon-192.png (192), apple-touch-icon.png (180)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
