import { BedDouble, ChefHat, Stethoscope, Store, UtensilsCrossed, Utensils, Warehouse, type LucideIcon } from "lucide-react";

export interface SolutionsSegment {
  slug: string;
  key: string;
  icon: LucideIcon;
}

export const SOLUTIONS_SEGMENTS: SolutionsSegment[] = [
  { slug: "hotels", key: "hotels", icon: BedDouble },
  { slug: "restaurants", key: "restaurants", icon: UtensilsCrossed },
  { slug: "catering", key: "catering", icon: ChefHat },
  { slug: "hospitals", key: "hospitals", icon: Stethoscope },
  { slug: "wholesale", key: "wholesale", icon: Warehouse },
  { slug: "retail", key: "retail", icon: Store },
  { slug: "food-service", key: "foodService", icon: Utensils },
];
