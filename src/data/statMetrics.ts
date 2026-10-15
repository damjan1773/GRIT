import { chartColors } from '../theme/colors';
import { IconHue } from '../theme/iconHues';
import type { SFSymbol } from 'sf-symbols-typescript';
import { Meal, UserProfile, WorkoutSession } from '../types';
import { DayValue, NutrientKey, TrainingKey, nutritionByDay, trainingByDay } from '../utils/stats';

export type MetricId = NutrientKey | TrainingKey;
export type MetricSection = 'nutrition' | 'training';

export interface MetricDef {
  id: MetricId;
  section: MetricSection;
  title: string;
  unit: string;
  /** SF Symbol for iOS; `icon` is the Material stand-in on Android and the web. */
  symbol: SFSymbol;
  icon: string;
  /** The icon's own colour, so each card reads as a different thing at a glance. */
  hue: IconHue;
  /**
   * Nutrition reads as a daily average over logged days; training as a total,
   * since a rest day is part of the plan rather than a missing entry.
   */
  headline: 'average' | 'total';
  goal?: (profile: UserProfile) => number;
}

export const METRICS: MetricDef[] = [
  { id: 'calories', section: 'nutrition', title: 'Kalorije', unit: 'kcal', symbol: 'flame.fill', icon: 'local_fire_department', hue: 'orange', headline: 'average', goal: p => p.targetCalories },
  { id: 'protein', section: 'nutrition', title: 'Proteini', unit: 'g', symbol: 'fish.fill', icon: 'egg', hue: 'blue', headline: 'average', goal: p => p.macroGoals.protein },
  { id: 'carbs', section: 'nutrition', title: 'Ugljeni hidrati', unit: 'g', symbol: 'popcorn.fill', icon: 'bakery_dining', hue: 'brown', headline: 'average', goal: p => p.macroGoals.carbs },
  { id: 'fats', section: 'nutrition', title: 'Masti', unit: 'g', symbol: 'drop.fill', icon: 'water_drop', hue: 'yellow', headline: 'average', goal: p => p.macroGoals.fats },
  { id: 'workouts', section: 'training', title: 'Treninzi', unit: '', symbol: 'dumbbell.fill', icon: 'fitness_center', hue: 'green', headline: 'total' },
  { id: 'volume', section: 'training', title: 'Volumen', unit: 'kg', symbol: 'chart.bar.fill', icon: 'stacked_bar_chart', hue: 'teal', headline: 'total' },
  { id: 'minutes', section: 'training', title: 'Vreme treninga', unit: 'min', symbol: 'timer', icon: 'timer', hue: 'purple', headline: 'total' },
];

export const SECTION_TITLES: Record<MetricSection, string> = { nutrition: 'Ishrana', training: 'Trening' };

export function sectionColor(section: MetricSection): string {
  return section === 'nutrition' ? chartColors.nutrition : chartColors.training;
}

export function findMetric(id: MetricId): MetricDef {
  return METRICS.find(m => m.id === id) ?? METRICS[0];
}

export function dailyValues(
  metric: MetricDef,
  data: { meals: Meal[]; sessions: WorkoutSession[] },
  dayKeys: string[]
): DayValue[] {
  return metric.section === 'nutrition'
    ? nutritionByDay(data.meals, dayKeys, metric.id as NutrientKey)
    : trainingByDay(data.sessions, dayKeys, metric.id as TrainingKey);
}
