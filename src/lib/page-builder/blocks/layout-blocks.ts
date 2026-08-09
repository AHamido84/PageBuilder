import { z } from "zod";
import { Columns2, Columns3, Grid2x2, Minus, MoveVertical } from "lucide-react";
import type { BlockDefinition } from "../types";
import { defaultSectionSettings } from "../types";
import {
  TwoColumnsEdit, TwoColumnsRender, ThreeColumnsEdit, ThreeColumnsRender, FourColumnsEdit, FourColumnsRender,
} from "./layout/columns";
import { DividerEdit, DividerRender, SpacerEdit, SpacerRender } from "./layout/divider-spacer";

const mediaRefSchema = z.object({ id: z.string(), url: z.string() });
const columnItemSchema = z.object({
  heading: z.string().max(150).default(""),
  body: z.string().max(600).default(""),
  image: mediaRefSchema.nullable().default(null),
  linkUrl: z.string().max(300).default(""),
  linkLabel: z.string().max(60).default(""),
});
const columnsSchema = z.object({ items: z.array(columnItemSchema).default([]) });
export type ColumnsData = z.infer<typeof columnsSchema>;

const dividerSchema = z.object({ style: z.enum(["line", "dots"]).default("line") });
export type DividerData = z.infer<typeof dividerSchema>;

const spacerSchema = z.object({ height: z.enum(["sm", "md", "lg", "xl"]).default("md") });
export type SpacerData = z.infer<typeof spacerSchema>;

function emptyColumnItem() {
  return { heading: "", body: "", image: null, linkUrl: "", linkLabel: "" };
}

function columnsBlock(
  count: 2 | 3 | 4,
  type: string,
  label: string,
  icon: BlockDefinition["icon"],
  Edit: BlockDefinition<ColumnsData>["Edit"],
  Render: BlockDefinition<ColumnsData>["Render"]
): BlockDefinition<ColumnsData> {
  const items = Array.from({ length: count }, emptyColumnItem);
  return {
    type,
    label,
    category: "layout",
    icon,
    dataSchema: columnsSchema,
    defaultData: { en: { items }, ar: { items } },
    defaultSettings: defaultSectionSettings(),
    Edit,
    Render,
  };
}

export const layoutBlocks: BlockDefinition<any>[] = [
  columnsBlock(2, "TWO_COLUMNS", "Two Columns", Columns2, TwoColumnsEdit, TwoColumnsRender),
  columnsBlock(3, "THREE_COLUMNS", "Three Columns", Columns3, ThreeColumnsEdit, ThreeColumnsRender),
  columnsBlock(4, "FOUR_COLUMNS", "Four Columns", Grid2x2, FourColumnsEdit, FourColumnsRender),
  {
    type: "DIVIDER",
    label: "Divider",
    category: "layout",
    icon: Minus,
    dataSchema: dividerSchema,
    defaultData: { en: { style: "line" }, ar: { style: "line" } },
    defaultSettings: defaultSectionSettings({ desktop: { paddingY: "sm", marginY: "none", align: "center", columns: "1", headingSize: "md", bodySize: "md", visible: true } }),
    Edit: DividerEdit,
    Render: DividerRender,
  } as BlockDefinition<DividerData>,
  {
    type: "SPACER",
    label: "Spacer",
    category: "layout",
    icon: MoveVertical,
    dataSchema: spacerSchema,
    defaultData: { en: { height: "md" }, ar: { height: "md" } },
    defaultSettings: defaultSectionSettings({ desktop: { paddingY: "none", marginY: "none", align: "center", columns: "1", headingSize: "md", bodySize: "md", visible: true } }),
    Edit: SpacerEdit,
    Render: SpacerRender,
  } as BlockDefinition<SpacerData>,
];
