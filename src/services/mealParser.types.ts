export interface MealParseItem {
  name: string;
  unitLabel: string;
  qty: number;
  /** Per-unit macros; multiply by qty to get the displayed totals. */
  unitCalories: number;
  unitProtein: number;
  unitCarbs: number;
  unitFats: number;
}

/** Superset of the required { calories, protein, carbs, fats } JSON shape. */
export interface MealParseResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  items: MealParseItem[];
}
