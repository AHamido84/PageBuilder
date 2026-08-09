import type { BlockDefinition } from "./types";
import { contentBlocks } from "./blocks/content-blocks";
import { mediaBlocks } from "./blocks/media-blocks";
import { layoutBlocks } from "./blocks/layout-blocks";
import { interactiveBlocks } from "./blocks/interactive-blocks";
import { commerceBlocks } from "./blocks/commerce-blocks";
import { socialProofBlocks } from "./blocks/social-proof-blocks";
import { formsBlocks } from "./blocks/forms-blocks";
import { miscBlocks } from "./blocks/misc-blocks";

const ALL_BLOCKS: BlockDefinition<any>[] = [
  ...contentBlocks,
  ...mediaBlocks,
  ...layoutBlocks,
  ...interactiveBlocks,
  ...commerceBlocks,
  ...socialProofBlocks,
  ...formsBlocks,
  ...miscBlocks,
];

export const BLOCK_REGISTRY: Record<string, BlockDefinition<any>> = Object.fromEntries(ALL_BLOCKS.map((b) => [b.type, b]));

export const ALL_BLOCK_TYPES: string[] = ALL_BLOCKS.map((b) => b.type);

export function getBlock(type: string): BlockDefinition<any> | undefined {
  return BLOCK_REGISTRY[type];
}

export const BLOCK_CATEGORIES: { key: BlockDefinition["category"]; label: string }[] = [
  { key: "content", label: "Content" },
  { key: "media", label: "Media" },
  { key: "layout", label: "Layout" },
  { key: "commerce", label: "Commerce" },
  { key: "social-proof", label: "Social Proof" },
  { key: "interactive", label: "Interactive" },
  { key: "forms", label: "Forms" },
  { key: "misc", label: "Misc" },
];
