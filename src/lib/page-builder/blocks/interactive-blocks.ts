import { z } from "zod";
import { HelpCircle, PanelsTopLeft, SquareStack } from "lucide-react";
import type { BlockDefinition } from "../types";
import { defaultSectionSettings } from "../types";
import { AccordionItemsEdit, FaqItemsEdit, TabsItemsEdit, AccordionListRender } from "./interactive/accordion";
import { TabsRender } from "./interactive/tabs";

const itemSchema = z.object({ title: z.string().max(200), body: z.string().max(1000) });
const listSchema = z.object({ heading: z.string().max(200).optional().default(""), items: z.array(itemSchema).default([]) });
export type ItemListData = z.infer<typeof listSchema>;

const defaultItems = [
  { title: "First item", body: "Details go here." },
  { title: "Second item", body: "Details go here." },
];

export const interactiveBlocks: BlockDefinition<any>[] = [
  {
    type: "ACCORDION",
    label: "Accordion",
    category: "interactive",
    icon: SquareStack,
    dataSchema: listSchema,
    defaultData: { en: { heading: "", items: defaultItems }, ar: { heading: "", items: defaultItems } },
    defaultSettings: defaultSectionSettings(),
    Edit: AccordionItemsEdit,
    Render: AccordionListRender,
  } as BlockDefinition<ItemListData>,
  {
    type: "FAQ",
    label: "FAQ",
    category: "interactive",
    icon: HelpCircle,
    dataSchema: listSchema,
    defaultData: {
      en: { heading: "Frequently asked questions", items: [{ title: "How does this work?", body: "Answer goes here." }] },
      ar: { heading: "الأسئلة الشائعة", items: [{ title: "كيف يعمل هذا؟", body: "الإجابة هنا." }] },
    },
    defaultSettings: defaultSectionSettings(),
    Edit: FaqItemsEdit,
    Render: AccordionListRender,
  } as BlockDefinition<ItemListData>,
  {
    type: "TABS",
    label: "Tabs",
    category: "interactive",
    icon: PanelsTopLeft,
    dataSchema: listSchema,
    defaultData: { en: { heading: "", items: defaultItems }, ar: { heading: "", items: defaultItems } },
    defaultSettings: defaultSectionSettings(),
    Edit: TabsItemsEdit,
    Render: TabsRender,
  } as BlockDefinition<ItemListData>,
];
