import { z } from "zod";
import { Contact2, MapPin, Share2, SplitSquareHorizontal, GalleryHorizontalEnd } from "lucide-react";
import type { BlockDefinition } from "../types";
import { defaultSectionSettings } from "../types";
import { ImageTextEdit, ImageTextRender } from "./misc/image-text";
import { MapEdit, MapRender } from "./misc/map";
import { SocialMediaEdit, SocialMediaRender } from "./misc/social-media";
import { ContactInfoEdit, ContactInfoPreview } from "./misc/contact-info";
import { ContactInfoRender } from "./misc/contact-info-render";
import { MarqueeEdit, MarqueePreview } from "./misc/marquee";
import { MarqueeRender } from "./misc/marquee-render";

const mediaRefSchema = z.object({ id: z.string(), url: z.string() });

const imageTextSchema = z.object({
  heading: z.string().max(200).optional().default(""),
  body: z.string().max(1000).optional().default(""),
  image: mediaRefSchema.nullable().default(null),
  imagePosition: z.enum(["left", "right"]).default("left"),
  ctaLabel: z.string().max(60).optional().default(""),
  ctaUrl: z.string().max(300).optional().default(""),
});
export type ImageTextData = z.infer<typeof imageTextSchema>;

const mapSchema = z.object({ address: z.string().max(300), zoom: z.number().int().min(1).max(20).default(14) });
export type MapData = z.infer<typeof mapSchema>;

const socialLinkSchema = z.object({ platform: z.string().max(30), url: z.string().max(300) });
const socialMediaSchema = z.object({ heading: z.string().max(200).optional().default(""), links: z.array(socialLinkSchema).default([]) });
export type SocialMediaData = z.infer<typeof socialMediaSchema>;

const contactInfoSchema = z.object({ heading: z.string().max(200).optional().default("") });
export type ContactInfoData = z.infer<typeof contactInfoSchema>;

const marqueeSchema = z.object({
  heading: z.string().max(200).optional().default(""),
  // Always real CMS data (brand or category names) -- never free-text, so this block can't be
  // used to fabricate content.
  source: z.enum(["brands", "categories"]).default("brands"),
});
export type MarqueeData = z.infer<typeof marqueeSchema>;

// `any` is required here, not a shortcut: this array holds BlockDefinition<T> for many different T (each
// entry individually typed via its own `as BlockDefinition<XData>` cast below), and TData's contravariant
// use in `onChange: (next: TData) => void` makes `BlockDefinition<unknown>[]` fail to typecheck against
// any specific entry -- confirmed by trying it and getting real tsc errors, not assumed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const miscBlocks: BlockDefinition<any>[] = [
  {
    type: "IMAGE_TEXT",
    label: "Image + Text",
    category: "misc",
    icon: SplitSquareHorizontal,
    dataSchema: imageTextSchema,
    defaultData: {
      en: { heading: "Heading", body: "", image: null, imagePosition: "left", ctaLabel: "", ctaUrl: "" },
      ar: { heading: "العنوان", body: "", image: null, imagePosition: "left", ctaLabel: "", ctaUrl: "" },
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
  {
    type: "CONTACT_INFO",
    label: "Contact Details",
    category: "misc",
    icon: Contact2,
    dataSchema: contactInfoSchema,
    defaultData: { en: { heading: "" }, ar: { heading: "" } },
    defaultSettings: defaultSectionSettings(),
    Edit: ContactInfoEdit,
    Render: ContactInfoRender,
    canvasPreview: ContactInfoPreview,
  } as BlockDefinition<ContactInfoData>,
  {
    type: "MARQUEE",
    label: "Marquee",
    category: "misc",
    icon: GalleryHorizontalEnd,
    dataSchema: marqueeSchema,
    defaultData: { en: { heading: "", source: "brands" }, ar: { heading: "", source: "brands" } },
    defaultSettings: defaultSectionSettings({ desktop: { paddingY: "sm", marginY: "none", align: "center", columns: "1", headingSize: "md", bodySize: "md", visible: true } }),
    Edit: MarqueeEdit,
    Render: MarqueeRender,
    canvasPreview: MarqueePreview,
  } as BlockDefinition<MarqueeData>,
];
