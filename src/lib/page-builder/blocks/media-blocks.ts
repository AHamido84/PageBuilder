import { z } from "zod";
import { GalleryHorizontal, Image as ImageIcon, Rows3, Video } from "lucide-react";
import type { BlockDefinition } from "../types";
import { defaultSectionSettings } from "../types";
import { ImageEdit, ImageRender } from "./media/image";
import { VideoEdit, VideoRender } from "./media/video";
import { GalleryEdit, GalleryRender } from "./media/gallery";
import { LogoCloudEdit, LogoCloudRender } from "./media/logo-cloud";

const mediaRefSchema = z.object({ id: z.string(), url: z.string() });

const imageSchema = z.object({
  image: mediaRefSchema.nullable().default(null),
  altEn: z.string().max(200).optional().default(""),
  altAr: z.string().max(200).optional().default(""),
  linkUrl: z.string().max(300).optional().default(""),
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

const logoCloudSchema = z.object({
  heading: z.string().max(200).optional().default(""),
  logos: z.array(mediaRefSchema).max(20).default([]),
});
export type LogoCloudData = z.infer<typeof logoCloudSchema>;

export const mediaBlocks: BlockDefinition<any>[] = [
  {
    type: "IMAGE",
    label: "Image",
    category: "media",
    icon: ImageIcon,
    dataSchema: imageSchema,
    defaultData: { en: { image: null, altEn: "", altAr: "", linkUrl: "" }, ar: { image: null, altEn: "", altAr: "", linkUrl: "" } },
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
    defaultData: { en: { heading: "", logos: [] }, ar: { heading: "", logos: [] } },
    defaultSettings: defaultSectionSettings({ desktop: { paddingY: "md", marginY: "none", align: "center", columns: "4", headingSize: "md", bodySize: "md", visible: true } }),
    Edit: LogoCloudEdit,
    Render: LogoCloudRender,
  } as BlockDefinition<LogoCloudData>,
];
