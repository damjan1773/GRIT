/** Grams, millilitres, or whole pieces (an egg, a slice). */
export type MealUnit = 'g' | 'ml' | 'kom';

export interface MealParseItem {
  name: string;
  unit: MealUnit;
  /** Total eaten: grams, millilitres, or number of pieces. Always a whole number. */
  amount: number;
  /** Macros per 100 g / 100 ml, or per single piece — scaled by amount for the total. */
  perCalories: number;
  perProtein: number;
  perCarbs: number;
  perFats: number;
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

/** How much one tap of +/- changes the amount. */
export function stepFor(unit: MealUnit): number {
  return unit === 'kom' ? 1 : 5;
}

/** "300 g", "250 ml", "2 kom" — no multipliers, no decimals. */
export function formatAmount(item: MealParseItem): string {
  return `${item.amount} ${item.unit}`;
}

/** Totals for an item, scaling the per-100 (or per-piece) macros by the amount. */
export function itemTotals(item: MealParseItem) {
  const factor = item.unit === 'kom' ? item.amount : item.amount / 100;
  return {
    calories: Math.round(item.perCalories * factor),
    protein: Math.round(item.perProtein * factor),
    carbs: Math.round(item.perCarbs * factor),
    fats: Math.round(item.perFats * factor),
  };
}

export function sumTotals(items: MealParseItem[]) {
  return items.reduce(
    (acc, item) => {
      const totals = itemTotals(item);
      return {
        calories: acc.calories + totals.calories,
        protein: acc.protein + totals.protein,
        carbs: acc.carbs + totals.carbs,
        fats: acc.fats + totals.fats,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
}
