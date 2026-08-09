import { z } from "zod";
import { MapPin, Share2, SplitSquareHorizontal } from "lucide-react";
import type { BlockDefinition } from "../types";
import { defaultSectionSettings } from "../types";
import { ImageTextEdit, ImageTextRender } from "./misc/image-text";
import { MapEdit, MapRender } from "./misc/map";
import { SocialMediaEdit, SocialMediaRender } from "./misc/social-media";

const mediaRefSchema = z.object({ id: z.string(), url: z.string() });

const imageTextSchema = z.object({
  heading: z.string().max(200).optional().default(""),
  body: z.string().max(1000).optional().default(""),
  image: mediaRefSchema.nullable().default(null),
  imagePosition: z.enum(["left", "right"]).default("left"),
});
export type ImageTextData = z.infer<typeof imageTextSchema>;

const mapSchema = z.object({ address: z.string().max(300), zoom: z.number().int().min(1).max(20).default(14) });
export type MapData = z.infer<typeof mapSchema>;

const socialLinkSchema = z.object({ platform: z.string().max(30), url: z.string().max(300) });
const socialMediaSchema = z.object({ heading: z.string().max(200).optional().default(""), links: z.array(socialLinkSchema).default([]) });
export type SocialMediaData = z.infer<typeof socialMediaSchema>;

export const miscBlocks: BlockDefinition<any>[] = [
  {
    type: "IMAGE_TEXT",
    label: "Image + Text",
    category: "misc",
    icon: SplitSquareHorizontal,
    dataSchema: imageTextSchema,
    defaultData: {
      en: { heading: "Heading", body: "", image: null, imagePosition: "left" },
      ar: { heading: "العنوان", body: "", image: null, imagePosition: "left" },
    },
    defaultSettings: defaultSectionSettings({ background: "frost" }),
    Edit: ImageTextEdit,
    Render: ImageTextRender,
  } as BlockDefinition<ImageTextData>,
  {
    type: "MAP",
    label: "Map",
    category: "misc",
    icon: MapPin,
    dataSchema: mapSchema,
    defaultData: { en: { address: "Jeddah, Saudi Arabia", zoom: 12 }, ar: { address: "جدة، المملكة العربية السعودية", zoom: 12 } },
    defaultSettings: defaultSectionSettings(),
    Edit: MapEdit,
    Render: MapRender,
  } as BlockDefinition<MapData>,
  {
    type: "SOCIAL_MEDIA",
    label: "Social Media",
    category: "misc",
    icon: Share2,
    dataSchema: socialMediaSchema,
    defaultData: { en: { heading: "", links: [] }, ar: { heading: "", links: [] } },
    defaultSettings: defaultSectionSettings({ desktop: { paddingY: "sm", marginY: "none", align: "center", columns: "1", headingSize: "md", bodySize: "md", visible: true } }),
    Edit: SocialMediaEdit,
    Render: SocialMediaRender,
  } as BlockDefinition<SocialMediaData>,
];
