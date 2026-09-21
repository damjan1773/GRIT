import { chartColors } from '../theme/colors';
import { Meal, UserProfile, WorkoutSession } from '../types';
import { DayValue, NutrientKey, TrainingKey, nutritionByDay, trainingByDay } from '../utils/stats';

export type MetricId = NutrientKey | TrainingKey;
export type MetricSection = 'nutrition' | 'training';

export interface MetricDef {
  id: MetricId;
  section: MetricSection;
  title: string;
  unit: string;
  icon: string;
  /**
   * Nutrition reads as a daily average over logged days; training as a total,
   * since a rest day is part of the plan rather than a missing entry.
   */
  headline: 'average' | 'total';
  goal?: (profile: UserProfile) => number;
}

export const METRICS: MetricDef[] = [
  { id: 'calories', section: 'nutrition', title: 'Kalorije', unit: 'kcal', icon: 'local_fire_department', headline: 'average', goal: p => p.targetCalories },
  { id: 'protein', section: 'nutrition', title: 'Proteini', unit: 'g', icon: 'egg', headline: 'average', goal: p => p.macroGoals.protein },
  { id: 'carbs', section: 'nutrition', title: 'Ugljeni hidrati', unit: 'g', icon: 'bakery_dining', headline: 'average', goal: p => p.macroGoals.carbs },
  { id: 'fats', section: 'nutrition', title: 'Masti', unit: 'g', icon: 'water_drop', headline: 'average', goal: p => p.macroGoals.fats },
  { id: 'workouts', section: 'training', title: 'Treninzi', unit: '', icon: 'fitness_center', headline: 'total' },
  { id: 'volume', section: 'training', title: 'Volumen', unit: 'kg', icon: 'monitor_weight', headline: 'total' },
  { id: 'minutes', section: 'training', title: 'Vreme treninga', unit: 'min', icon: 'timer', headline: 'total' },
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
