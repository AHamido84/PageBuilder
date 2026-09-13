import { z } from "zod";
import { GalleryHorizontal, Image as ImageIcon, Rows3, Video } from "lucide-react";
import type { BlockDefinition } from "../types";
import { defaultSectionSettings } from "../types";
import { ImageEdit, ImageRender } from "./media/image";
import { VideoEdit, VideoRender } from "./media/video";
import { GalleryEdit, GalleryRender } from "./media/gallery";
import { LogoCloudEdit, LogoCloudRender } from "./media/logo-cloud";

const mediaRefSchema = z.object({ id: z.string(), url: z.string() });

// Phase 7 "Image Control": aspectRatio/imageFit/focalX/focalY/overlayOpacity/mobileImage are all
// additive + defaulted so every already-published IMAGE section (pre-fix data has none of these
// fields) keeps rendering through the exact original plain-<img>-intrinsic-size path -- see the
// `aspectRatio === "auto"` guard in ImageRender. The fixed-box/fit/focal/overlay path only ever
// activates once an admin explicitly picks a ratio, a distinct mobile image, or an overlay.
const imageSchema = z.object({
  image: mediaRefSchema.nullable().default(null),
  /** Optional distinct mobile crop/asset -- falls back to `image` on narrow viewports when unset. */
  mobileImage: mediaRefSchema.nullable().optional().default(null),
  altEn: z.string().max(200).optional().default(""),
  altAr: z.string().max(200).optional().default(""),
  linkUrl: z.string().max(300).optional().default(""),
  aspectRatio: z.enum(["auto", "16/9", "4/3", "3/2", "1/1", "21/9"]).optional().default("auto"),
  imageFit: z.enum(["cover", "contain"]).optional().default("cover"),
  focalX: z.number().min(0).max(100).optional().default(50),
  focalY: z.number().min(0).max(100).optional().default(50),
  overlayOpacity: z.number().min(0).max(100).optional().default(0),
});
export type ImageData = z.infer<typeof imageSchema>;

const videoSchema = z.object({
  mode: z.enum(["upload", "embed"]).default("embed"),
  video: mediaRefSchema.nullable().default(null),
  embedUrl: z.string().max(500).optional().default(""),
});
export type VideoData = z.infer<typeof videoSchema>;

const gallerySchema = z.object({
  heading: z.string().max(200).optional().default(""),
  images: z.array(mediaRefSchema).max(12).default([]),
});
export type GalleryData = z.infer<typeof gallerySchema>;

const logoCloudItemSchema = z.object({
  id: z.string(),
  url: z.string(),
  alt: z.string().max(200).optional().default(""),
  link: z.string().max(500).optional().default(""),
  openInNewTab: z.boolean().optional().default(false),
});

const logoCloudSchema = z.object({
  heading: z.string().max(200).optional().default(""),
  logos: z.array(logoCloudItemSchema).max(20).default([]),
  // Root-cause fix for "brand logos look disabled/faded": these used to be hardcoded
  // (opacity-60 grayscale, full color only on hover) with no admin control and no touch-device
  // fallback. Defaults now match the spec's "opacity 1 / filter none unless intentionally
  // configured" rule -- existing saved sections (pre-fix data has none of these fields) pick up
  // full-visibility defaults automatically via Zod's per-field .default(), no migration needed.
  width: z.number().min(0).max(400).optional().default(0), // 0 = auto, derived from height
  height: z.number().min(16).max(200).optional().default(40),
  objectFit: z.enum(["contain", "cover"]).optional().default("contain"),
  borderRadius: z.number().min(0).max(48).optional().default(0),
  hoverAnimation: z.enum(["none", "scale", "lift", "grayscale-to-color"]).optional().default("scale"),
  hoverScale: z.number().min(1).max(1.3).optional().default(1.06),
  opacity: z.number().min(0).max(100).optional().default(100),
  background: z.enum(["none", "paper", "frost"]).optional().default("none"),
  padding: z.number().min(0).max(48).optional().default(0),
});
export type LogoCloudItem = z.infer<typeof logoCloudItemSchema>;
export type LogoCloudData = z.infer<typeof logoCloudSchema>;

// `any` is required here, not a shortcut: this array holds BlockDefinition<T> for many different T (each
// entry individually typed via its own `as BlockDefinition<XData>` cast below), and TData's contravariant
// use in `onChange: (next: TData) => void` makes `BlockDefinition<unknown>[]` fail to typecheck against
// any specific entry -- confirmed by trying it and getting real tsc errors, not assumed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mediaBlocks: BlockDefinition<any>[] = [
  {
    type: "IMAGE",
    label: "Image",
    category: "media",
    icon: ImageIcon,
    dataSchema: imageSchema,
    defaultData: {
      en: { image: null, mobileImage: null, altEn: "", altAr: "", linkUrl: "", aspectRatio: "auto", imageFit: "cover", focalX: 50, focalY: 50, overlayOpacity: 0 },
      ar: { image: null, mobileImage: null, altEn: "", altAr: "", linkUrl: "", aspectRatio: "auto", imageFit: "cover", focalX: 50, focalY: 50, overlayOpacity: 0 },
    },
    defaultSettings: defaultSectionSettings(),
    Edit: ImageEdit,
    Render: ImageRender,
  } as BlockDefinition<ImageData>,
  {
    type: "VIDEO",
    label: "Video",
    category: "media",
    icon: Video,
    dataSchema: videoSchema,
    defaultData: { en: { mode: "embed", video: null, embedUrl: "" }, ar: { mode: "embed", video: null, embedUrl: "" } },
    defaultSettings: defaultSectionSettings(),
    Edit: VideoEdit,
    Render: VideoRender,
  } as BlockDefinition<VideoData>,
  {
    type: "GALLERY",
    label: "Gallery",
    category: "media",
    icon: GalleryHorizontal,
    supportsColumns: true,
    dataSchema: gallerySchema,
    defaultData: { en: { heading: "", images: [] }, ar: { heading: "", images: [] } },
    defaultSettings: defaultSectionSettings({ desktop: { paddingY: "lg", marginY: "none", align: "left", columns: "3", headingSize: "lg", bodySize: "md", visible: true } }),
    Edit: GalleryEdit,
    Render: GalleryRender,
  } as BlockDefinition<GalleryData>,
  {
    type: "LOGO_CLOUD",
    label: "Logo Cloud",
    category: "media",
    icon: Rows3,
    dataSchema: logoCloudSchema,
    defaultData: {
      en: { heading: "", logos: [], width: 0, height: 40, objectFit: "contain", borderRadius: 0, hoverAnimation: "scale", hoverScale: 1.06, opacity: 100, background: "none", padding: 0 },
      ar: { heading: "", logos: [], width: 0, height: 40, objectFit: "contain", borderRadius: 0, hoverAnimation: "scale", hoverScale: 1.06, opacity: 100, background: "none", padding: 0 },
    },
    defaultSettings: defaultSectionSettings({ desktop: { paddingY: "md", marginY: "none", align: "center", columns: "4", headingSize: "md", bodySize: "md", visible: true } }),
    Edit: LogoCloudEdit,
    Render: LogoCloudRender,
  } as BlockDefinition<LogoCloudData>,
];
