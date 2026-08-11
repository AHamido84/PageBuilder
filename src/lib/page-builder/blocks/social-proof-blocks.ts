import { z } from "zod";
import { BarChart3, LayoutGrid, MessageSquareQuote, Milestone, Sparkle } from "lucide-react";
import type { BlockDefinition } from "../types";
import { defaultSectionSettings } from "../types";
import { TestimonialsEdit, TestimonialsRender } from "./social-proof/testimonials";
import { StatisticsEdit, StatisticsRender } from "./social-proof/statistics";
import { TimelineEdit, TimelineRender } from "./social-proof/timeline";
import { FeatureCardsRender } from "./social-proof/feature-cards";
import { IconCardsEdit, IconCardsRender } from "./social-proof/icon-cards";
import { CardItemsEdit } from "./interactive/accordion";

const testimonialItemSchema = z.object({ quote: z.string().max(600), authorName: z.string().max(150), authorRole: z.string().max(150).optional().default("") });
const testimonialsSchema = z.object({ heading: z.string().max(200).optional().default(""), items: z.array(testimonialItemSchema).default([]) });
export type TestimonialsData = z.infer<typeof testimonialsSchema>;

const statItemSchema = z.object({ value: z.string().max(40), label: z.string().max(150) });
const statisticsSchema = z.object({ heading: z.string().max(200).optional().default(""), items: z.array(statItemSchema).default([]) });
export type StatisticsData = z.infer<typeof statisticsSchema>;

const timelineItemSchema = z.object({ date: z.string().max(60).optional().default(""), title: z.string().max(150), body: z.string().max(500) });
const timelineSchema = z.object({ heading: z.string().max(200).optional().default(""), items: z.array(timelineItemSchema).default([]) });
export type TimelineData = z.infer<typeof timelineSchema>;

const featureCardItemSchema = z.object({ title: z.string().max(150), body: z.string().max(500) });
const featureCardsSchema = z.object({ heading: z.string().max(200).optional().default(""), items: z.array(featureCardItemSchema).max(6).default([]) });
export type FeatureCardsData = z.infer<typeof featureCardsSchema>;

const iconCardItemSchema = z.object({ icon: z.string().max(40), title: z.string().max(150), body: z.string().max(500), link: z.string().max(300).optional().default("") });
const iconCardsSchema = z.object({ heading: z.string().max(200).optional().default(""), items: z.array(iconCardItemSchema).default([]) });
export type IconCardsData = z.infer<typeof iconCardsSchema>;

const defaultFeatureCards = [
  { title: "Cold-chain discipline", body: "Handled to its required temperature class from receiving to delivery." },
  { title: "Full-catalog distribution", body: "One supplier across frozen, chilled, and ambient goods." },
];

// `any` is required here, not a shortcut: this array holds BlockDefinition<T> for many different T (each
// entry individually typed via its own `as BlockDefinition<XData>` cast below), and TData's contravariant
// use in `onChange: (next: TData) => void` makes `BlockDefinition<unknown>[]` fail to typecheck against
// any specific entry -- confirmed by trying it and getting real tsc errors, not assumed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const socialProofBlocks: BlockDefinition<any>[] = [
  {
    type: "TESTIMONIALS",
    label: "Testimonials",
    category: "social-proof",
    icon: MessageSquareQuote,
    supportsColumns: true,
    dataSchema: testimonialsSchema,
    defaultData: { en: { heading: "What our customers say", items: [] }, ar: { heading: "ماذا يقول عملاؤنا", items: [] } },
    defaultSettings: defaultSectionSettings({ desktop: { paddingY: "lg", marginY: "none", align: "left", columns: "3", headingSize: "lg", bodySize: "md", visible: true } }),
    Edit: TestimonialsEdit,
    Render: TestimonialsRender,
  } as BlockDefinition<TestimonialsData>,
  {
    type: "STATISTICS",
    label: "Statistics",
    category: "social-proof",
    icon: BarChart3,
    supportsColumns: true,
    dataSchema: statisticsSchema,
    defaultData: { en: { heading: "", items: [] }, ar: { heading: "", items: [] } },
    defaultSettings: defaultSectionSettings({ desktop: { paddingY: "lg", marginY: "none", align: "center", columns: "4", headingSize: "lg", bodySize: "md", visible: true } }),
    Edit: StatisticsEdit,
    Render: StatisticsRender,
  } as BlockDefinition<StatisticsData>,
  {
    type: "TIMELINE",
    label: "Timeline",
    category: "social-proof",
    icon: Milestone,
    dataSchema: timelineSchema,
    defaultData: { en: { heading: "", items: [] }, ar: { heading: "", items: [] } },
    defaultSettings: defaultSectionSettings(),
    Edit: TimelineEdit,
    Render: TimelineRender,
  } as BlockDefinition<TimelineData>,
  {
    type: "FEATURE_CARDS",
    label: "Feature Cards",
    category: "social-proof",
    icon: LayoutGrid,
    supportsColumns: true,
    dataSchema: featureCardsSchema,
    defaultData: { en: { heading: "", items: defaultFeatureCards }, ar: { heading: "", items: defaultFeatureCards } },
    defaultSettings: defaultSectionSettings({ desktop: { paddingY: "lg", marginY: "none", align: "left", columns: "4", headingSize: "lg", bodySize: "md", visible: true } }),
    Edit: CardItemsEdit,
    Render: FeatureCardsRender,
  } as BlockDefinition<FeatureCardsData>,
  {
    type: "ICON_CARDS",
    label: "Icon Cards",
    category: "social-proof",
    icon: Sparkle,
    supportsColumns: true,
    dataSchema: iconCardsSchema,
    defaultData: { en: { heading: "", items: [] }, ar: { heading: "", items: [] } },
    defaultSettings: defaultSectionSettings({ desktop: { paddingY: "lg", marginY: "none", align: "left", columns: "3", headingSize: "lg", bodySize: "md", visible: true } }),
    Edit: IconCardsEdit,
    Render: IconCardsRender,
  } as BlockDefinition<IconCardsData>,
];
