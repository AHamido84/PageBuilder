import { z } from "zod";
import { Heading1, MousePointerClick, Sparkles, Type } from "lucide-react";
import type { BlockDefinition } from "../types";
import { defaultSectionSettings } from "../types";
import { HeroEdit, HeroRender } from "./content/hero";
import { HeadingEdit, HeadingRender } from "./content/heading";
import { RichTextEdit, RichTextRender } from "./content/rich-text";
import { CtaEdit, CtaRender } from "./content/cta";

const heroSchema = z.object({
  headline: z.string().max(200),
  subheading: z.string().max(400).optional().default(""),
  ctaLabel: z.string().max(60).optional().default(""),
  ctaUrl: z.string().max(300).optional().default(""),
  imageId: z.string().optional().default(""),
});
export type HeroData = z.infer<typeof heroSchema>;

const headingSchema = z.object({
  text: z.string().max(200),
  level: z.enum(["h1", "h2", "h3"]).default("h2"),
});
export type HeadingData = z.infer<typeof headingSchema>;

const richTextSchema = z.object({
  html: z.string().max(20000).default(""),
});
export type RichTextData = z.infer<typeof richTextSchema>;

const ctaSchema = z.object({
  heading: z.string().max(200).optional().default(""),
  body: z.string().max(500).optional().default(""),
  ctaLabel: z.string().max(60),
  ctaUrl: z.string().max(300),
});
export type CtaData = z.infer<typeof ctaSchema>;

export const contentBlocks: BlockDefinition<any>[] = [
  {
    type: "HERO",
    label: "Hero",
    category: "content",
    icon: Sparkles,
    dataSchema: heroSchema,
    defaultData: {
      en: { headline: "Your headline here", subheading: "", ctaLabel: "", ctaUrl: "", imageId: "" },
      ar: { headline: "العنوان الرئيسي هنا", subheading: "", ctaLabel: "", ctaUrl: "", imageId: "" },
    },
    defaultSettings: defaultSectionSettings({ background: "ink", desktop: { paddingY: "xl", marginY: "none", align: "center", columns: "1", headingSize: "2xl", bodySize: "md", visible: true } }),
    Edit: HeroEdit,
    Render: HeroRender,
  } as BlockDefinition<HeroData>,
  {
    type: "HEADING",
    label: "Heading",
    category: "content",
    icon: Heading1,
    dataSchema: headingSchema,
    defaultData: { en: { text: "Section heading", level: "h2" }, ar: { text: "عنوان القسم", level: "h2" } },
    defaultSettings: defaultSectionSettings({ desktop: { paddingY: "md", marginY: "none", align: "left", columns: "1", headingSize: "lg", bodySize: "md", visible: true } }),
    Edit: HeadingEdit,
    Render: HeadingRender,
  } as BlockDefinition<HeadingData>,
  {
    type: "RICH_TEXT",
    label: "Rich Text",
    category: "content",
    icon: Type,
    dataSchema: richTextSchema,
    defaultData: { en: { html: "<p>Write something...</p>" }, ar: { html: "<p>اكتب شيئًا...</p>" } },
    defaultSettings: defaultSectionSettings({ desktop: { paddingY: "md", marginY: "none", align: "left", columns: "1", headingSize: "lg", bodySize: "md", visible: true } }),
    Edit: RichTextEdit,
    Render: RichTextRender,
  } as BlockDefinition<RichTextData>,
  {
    type: "CTA",
    label: "CTA",
    category: "content",
    icon: MousePointerClick,
    dataSchema: ctaSchema,
    defaultData: {
      en: { heading: "Ready to get started?", body: "", ctaLabel: "Contact us", ctaUrl: "/contact" },
      ar: { heading: "هل أنت مستعد للبدء؟", body: "", ctaLabel: "تواصل معنا", ctaUrl: "/contact" },
    },
    defaultSettings: defaultSectionSettings({ background: "ink", desktop: { paddingY: "lg", marginY: "none", align: "center", columns: "1", headingSize: "xl", bodySize: "md", visible: true } }),
    Edit: CtaEdit,
    Render: CtaRender,
  } as BlockDefinition<CtaData>,
];
