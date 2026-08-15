import { BedDouble, ChefHat, Stethoscope, Store, UtensilsCrossed, Utensils, Warehouse, type LucideIcon } from "lucide-react";

export interface SolutionsSegment {
  slug: string;
  key: string;
  icon: LucideIcon;
  /** A distinct RouteLine accent per segment (all in a 0 0 80 36 viewBox) — decorative, but each shape is different so the 7 pages read as visually distinct rather than repeating one motif with a swapped icon. */
  accentPath: string;
}

export const SOLUTIONS_SEGMENTS: SolutionsSegment[] = [
  { slug: "hotels", key: "hotels", icon: BedDouble, accentPath: "M4 30 Q 40 4 76 30" },
  { slug: "restaurants", key: "restaurants", icon: UtensilsCrossed, accentPath: "M4 8 L24 30 L44 8 L64 30 L76 16" },
  { slug: "catering", key: "catering", icon: ChefHat, accentPath: "M4 30 Q 20 6 36 30 Q 52 6 68 30" },
  { slug: "hospitals", key: "hospitals", icon: Stethoscope, accentPath: "M4 20 L30 20 L30 4 L46 4 L46 20 L76 20" },
  { slug: "wholesale", key: "wholesale", icon: Warehouse, accentPath: "M4 32 L4 12 L26 12 L26 24 L48 24 L48 4 L76 4" },
  { slug: "retail", key: "retail", icon: Store, accentPath: "M4 20 Q 20 8 36 20 Q 52 32 68 20 L76 20" },
  { slug: "food-service", key: "foodService", icon: Utensils, accentPath: "M4 30 L30 4 M30 4 L30 14 M4 30 L76 4" },
];
