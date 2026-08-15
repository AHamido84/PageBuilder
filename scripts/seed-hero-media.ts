/**
 * Uploads the two real hero photos (cropped to pure photography -- truck + Golden Seven / Totapuri
 * product packaging + the world-map overlay graphic, no baked-in nav/text/stats) through the actual
 * upload pipeline (`saveUploadedFile` -> Vercel Blob + a real `Media` row), exactly as an admin
 * uploading through the UI would get. Prints the resulting Media ids for use in seed-homepage.ts.
 *
 * Run: npx tsx scripts/seed-hero-media.ts
 */
import { readFileSync } from "node:fs";
import { prisma } from "../src/lib/prisma";
import { saveUploadedFile } from "../src/lib/media-upload";

const SCRATCHPAD = String.raw`C:\Users\mrahm\AppData\Local\Temp\claude\D--Claude-Code\6e5bad8e-a1ab-493d-8c5e-d6fa33f75d23\scratchpad`;

async function uploadHeroImage(fileName: string, originalName: string, altTextEn: string, altTextAr: string) {
  const buffer = readFileSync(`${SCRATCHPAD}\\${fileName}`);
  const file = new File([buffer], originalName, { type: "image/png" });
  const saved = await saveUploadedFile(file);
  const media = await prisma.media.create({
    data: {
      fileName: saved.fileName,
      originalName,
      mimeType: saved.mimeType,
      type: saved.type,
      sizeBytes: saved.sizeBytes,
      url: saved.url,
      width: saved.width,
      height: saved.height,
      altTextEn,
      altTextAr,
    },
  });
  console.log(`${originalName} -> ${media.id} (${media.url})`);
  return media.id;
}

async function main() {
  const enId = await uploadHeroImage(
    "hero-crop-English.png",
    "hero-default-en.png",
    "Seven Eleven Trading delivery truck with Golden Seven French fries and Totapuri mango pulp",
    "شاحنة توصيل سفن إليفن للتجارة مع بطاطس جولدن سفن المقلية ولب مانجو توتابوري"
  );
  const arId = await uploadHeroImage(
    "hero-crop-Arabic.png",
    "hero-default-ar.png",
    "Seven Eleven Trading delivery truck with Golden Seven French fries and Totapuri mango pulp",
    "شاحنة توصيل سفن إليفن للتجارة مع بطاطس جولدن سفن المقلية ولب مانجو توتابوري"
  );
  console.log(JSON.stringify({ enId, arId }));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
