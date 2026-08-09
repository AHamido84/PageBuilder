export const BLOCK_TYPES = [
  { value: "HERO", label: "Hero" },
  { value: "TEXT", label: "Text" },
  { value: "VALUE_PROPS", label: "Value props (up to 4)" },
  { value: "MEDIA_TEXT", label: "Media + text" },
  { value: "GALLERY", label: "Gallery (up to 6 images)" },
  { value: "PRODUCT_GRID", label: "Product grid" },
  { value: "CONTACT_CTA", label: "Contact CTA" },
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number]["value"];

export function blockTypeLabel(type: string): string {
  return BLOCK_TYPES.find((b) => b.value === type)?.label ?? type;
}
