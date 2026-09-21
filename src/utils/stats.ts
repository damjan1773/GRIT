import { Meal, WorkoutSession } from '../types';
import { shiftDateKey, toDateKey } from './dates';
import { sessionVolume } from './workouts';

export type Period = 'week' | 'month';
export const PERIOD_DAYS: Record<Period, number> = { week: 7, month: 30 };

/** The period's day keys, ending today, oldest first. */
export function periodDayKeys(todayKey: string, period: Period): string[] {
  const count = PERIOD_DAYS[period];
  return Array.from({ length: count }, (_, i) => shiftDateKey(todayKey, i - (count - 1)));
}

export interface DayValue {
  dateKey: string;
  value: number;
  /** A logged meal or a workout that day — distinguishes "0" from "nothing recorded". */
  hasData: boolean;
}

export type NutrientKey = 'calories' | 'protein' | 'carbs' | 'fats';
export type TrainingKey = 'workouts' | 'volume' | 'minutes';

export function nutritionByDay(meals: Meal[], dayKeys: string[], key: NutrientKey): DayValue[] {
  const wanted = new Set(dayKeys);
  const totals = new Map<string, number>();
  for (const meal of meals) {
    if (!wanted.has(meal.dateKey)) continue;
    totals.set(meal.dateKey, (totals.get(meal.dateKey) ?? 0) + meal[key]);
  }
  return dayKeys.map(dateKey => ({
    dateKey,
    value: Math.round(totals.get(dateKey) ?? 0),
    hasData: totals.has(dateKey),
  }));
}

export function sessionDateKey(session: WorkoutSession): string {
  return toDateKey(new Date(session.startedAt));
}

export function sessionMinutes(session: WorkoutSession): number {
  return session.finishedAt ? Math.max(0, Math.round((session.finishedAt - session.startedAt) / 60_000)) : 0;
}

export function trainingByDay(sessions: WorkoutSession[], dayKeys: string[], key: TrainingKey): DayValue[] {
  const wanted = new Set(dayKeys);
  const totals = new Map<string, number>();
  for (const session of sessions) {
    const dateKey = sessionDateKey(session);
    if (!wanted.has(dateKey)) continue;
    const add = key === 'workouts' ? 1 : key === 'volume' ? sessionVolume(session) : sessionMinutes(session);
    totals.set(dateKey, (totals.get(dateKey) ?? 0) + add);
  }
  return dayKeys.map(dateKey => ({
    dateKey,
    value: Math.round(totals.get(dateKey) ?? 0),
    hasData: totals.has(dateKey),
  }));
}

export interface PeriodSummary {
  total: number;
  /** Averaged over days that have data, so an unlogged day doesn't read as a zero. */
  average: number;
  daysWithData: number;
  max: DayValue | null;
}

export function summarize(days: DayValue[]): PeriodSummary {
  const withData = days.filter(d => d.hasData);
  const total = withData.reduce((sum, d) => sum + d.value, 0);
  const max = withData.reduce<DayValue | null>((best, d) => (!best || d.value > best.value ? d : best), null);
  return {
    total,
    average: withData.length ? total / withData.length : 0,
    daysWithData: withData.length,
    max,
  };
}

/** Within ±10% of the goal counts as on target. */
export function isOnGoal(value: number, goal: number): boolean {
  return goal > 0 && value >= goal * 0.9 && value <= goal * 1.1;
}

/**
 * Epley's estimate of a one-rep max, so a heavy triple and a lighter set of ten
 * land on one scale. Rounded to the half-kilo plates actually come in.
 */
export function estimateOneRepMax(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  const estimate = reps === 1 ? weightKg : weightKg * (1 + reps / 30);
  return Math.round(estimate * 2) / 2;
}

export interface ExercisePoint {
  sessionId: string;
  dateKey: string;
  finishedAt: number;
  /** The set with the best estimated 1RM — or the most reps, for bodyweight work. */
  bestWeightKg: number;
  bestReps: number;
  e1rm: number;
  maxReps: number;
  volume: number;
  sets: number;
}

export interface ExerciseHistory {
  /** Lower-cased name: the same lift typed with different capitals is one lift. */
  key: string;
  name: string;
  /** No weight ever logged — progress is read in reps instead of kilograms. */
  bodyweight: boolean;
  /** Oldest first. */
  points: ExercisePoint[];
}

export function exerciseHistories(sessions: WorkoutSession[]): ExerciseHistory[] {
  const byKey = new Map<string, ExerciseHistory>();
  // Stored newest first; walk oldest first so points come out in order.
  for (const session of [...sessions].reverse()) {
    for (const exercise of session.exercises) {
      const done = exercise.sets.filter(s => s.done && (s.reps ?? 0) > 0);
      if (done.length === 0) continue;

      let best = done[0];
      let bestE1rm = -1;
      for (const set of done) {
        const e1rm = estimateOneRepMax(set.weightKg ?? 0, set.reps ?? 0);
        const beats = e1rm > bestE1rm || (e1rm === bestE1rm && (set.reps ?? 0) > (best.reps ?? 0));
        if (beats) {
          best = set;
          bestE1rm = e1rm;
        }
      }

      const key = exercise.name.trim().toLowerCase();
      const history = byKey.get(key) ?? { key, name: exercise.name.trim(), bodyweight: true, points: [] };
      history.name = exercise.name.trim();
      history.points.push({
        sessionId: session.id,
        dateKey: sessionDateKey(session),
        finishedAt: session.finishedAt ?? session.startedAt,
        bestWeightKg: best.weightKg ?? 0,
        bestReps: best.reps ?? 0,
        e1rm: Math.max(0, bestE1rm),
        maxReps: Math.max(...done.map(s => s.reps ?? 0)),
        volume: done.reduce((sum, s) => sum + (s.weightKg ?? 0) * (s.reps ?? 0), 0),
        sets: done.length,
      });
      if (bestE1rm > 0) history.bodyweight = false;
      byKey.set(key, history);
    }
  }
  return [...byKey.values()].sort(
    (a, b) => b.points[b.points.length - 1].finishedAt - a.points[a.points.length - 1].finishedAt
  );
}

/** The number a lift's progress is read in: estimated 1RM, or reps for bodyweight. */
export function progressValue(history: ExerciseHistory, point: ExercisePoint): number {
  return history.bodyweight ? point.maxReps : point.e1rm;
}

/** Change from the first logged session to the latest. */
export function progressChange(history: ExerciseHistory): number {
  if (history.points.length < 2) return 0;
  const first = progressValue(history, history.points[0]);
  const last = progressValue(history, history.points[history.points.length - 1]);
  return last - first;
}

/** "2.410", "82,5" — Serbian grouping and decimal comma. */
export function formatNumber(value: number, maxDecimals = 0): string {
  return value.toLocaleString('sr-RS', { maximumFractionDigits: maxDecimals });
}

/**
 * Clean axis maxima whose half is also clean, since the axis ticks sit at 0, half
 * and max. Finer than 1/2/5 — rounding 3.400 up to 5.000 wastes a third of the plot.
 */
const NICE_STEPS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];

export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const fraction = value / magnitude;
  const nice = NICE_STEPS.find(step => fraction <= step) ?? 10;
  return nice * magnitude;
}
