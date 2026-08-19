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

/** Makro raspodela 25% proteini / 45% ugljeni hidrati / 30% masti */
export function calculateMacroGoals(targetCalories: number) {
  return {
    protein: Math.round((targetCalories * 0.25) / 4),
    carbs: Math.round((targetCalories * 0.45) / 4),
    fats: Math.round((targetCalories * 0.3) / 9),
  };
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
