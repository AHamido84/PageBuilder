import type { MetadataRoute } from "next";

/** Web app manifest (/manifest.webmanifest). Icons are static files in public/ (scripts/generate-brand-icons.ts). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Golden Seven Foods",
    short_name: "Golden Seven",
    description: "Wholesale frozen food supply in Jeddah and Saudi Arabia.",
    start_url: "/ar",
    display: "browser",
    background_color: "#f7f0e6",
    theme_color: "#0f414c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
