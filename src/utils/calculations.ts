import { ActivityLevel, ActivityOption, Sex } from '../types';

export const ACTIVITY_LEVELS: ActivityOption[] = [
  { id: 'sedentary', name: 'Sedelački', subtitle: 'Kancelarija, bez treninga', multiplier: 1.2 },
  { id: 'light', name: 'Lako aktivan', subtitle: '1–2 treninga nedeljno', multiplier: 1.375 },
  { id: 'moderate', name: 'Umereno aktivan', subtitle: '3–4 treninga nedeljno', multiplier: 1.55 },
  { id: 'active', name: 'Veoma aktivan', subtitle: '5–6 treninga nedeljno', multiplier: 1.725 },
  { id: 'athlete', name: 'Sportista', subtitle: 'Dnevni treninzi ili fizički rad', multiplier: 1.9 },
];

export function getActivityOption(activity: ActivityLevel): ActivityOption {
  return ACTIVITY_LEVELS.find(a => a.id === activity) ?? ACTIVITY_LEVELS[2];
}

/** Mifflin-St Jeor: muško = 10w + 6.25h - 5a + 5, žensko = 10w + 6.25h - 5a - 161 */
export function calculateBMR(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === 'm' ? base + 5 : base - 161);
}

export function calculateTDEE(bmr: number, activity: ActivityLevel): number {
  return Math.round(bmr * getActivityOption(activity).multiplier);
}

/** Protein per kilogram of body mass: the middle of the 1.6–2.2 g/kg the research supports. */
export const PROTEIN_G_PER_KG = 2;
/** Share of the day's calories from fat. */
export const FAT_SHARE = 0.3;

/**
 * Protein follows body mass (2 g/kg), not a share of calories — a percentage
 * overshoots on a large target and undershoots on a cut. Fat takes 30% of the
 * calories and carbohydrate whatever is left.
 */
export function calculateMacroGoals(targetCalories: number, weightKg: number) {
  const protein = Math.round(weightKg * PROTEIN_G_PER_KG);
  const fats = Math.round((targetCalories * FAT_SHARE) / 9);
  // On a very small target the remainder could go negative; never below zero.
  const carbs = Math.max(0, Math.round((targetCalories - protein * 4 - fats * 9) / 4));
  return { protein, carbs, fats };
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  return weightKg / Math.pow(heightCm / 100, 2);
}

export function bmiLabel(bmi: number): string {
  if (bmi < 18.5) return 'ispod normale';
  if (bmi < 25) return 'zdrav raspon';
  if (bmi < 30) return 'povišena telesna masa';
  return 'visoka telesna masa';
}

/** The goal slider's reach either side of maintenance, in kcal/day. */
export const GOAL_ADJUSTMENT_LIMIT = 1000;
export const GOAL_ADJUSTMENT_STEP = 50;

/** Rough energy content of a kilogram of body mass — good enough for estimates. */
export const KCAL_PER_KG = 7700;

export function goalLabel(calorieAdjustment: number): string {
  if (calorieAdjustment < 0) return 'Mršavljenje';
  if (calorieAdjustment > 0) return 'Dobijanje mase';
  return 'Održavanje';
}

/** Estimated body-mass change in kg after `days` at a steady daily offset. */
export function estimateWeightChangeKg(calorieAdjustment: number, days: number): number {
  return (calorieAdjustment * days) / KCAL_PER_KG;
}
