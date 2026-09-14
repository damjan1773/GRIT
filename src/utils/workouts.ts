import { Exercise, Workout } from '../types';

export function totalSets(workout: Workout): number {
  return workout.exercises.reduce((sum, e) => sum + e.sets, 0);
}

/** Rough session length — about two minutes per set, rest included — to the nearest 5. */
export function estimateMinutes(workout: Workout): number {
  return Math.max(10, Math.round((totalSets(workout) * 2) / 5) * 5);
}

/** "3 × 10", or "3 × 45 s" for a timed hold. */
export function formatPrescription(exercise: Exercise): string {
  return exercise.unit === 'sec' ? `${exercise.sets} × ${exercise.reps} s` : `${exercise.sets} × ${exercise.reps}`;
}

/** "1 vežba", "3 vežbe", "6 vežbi" — Serbian plural agreement. */
export function exerciseCountLabel(count: number): string {
  const lastTwo = count % 100;
  const last = count % 10;
  if (last === 1 && lastTwo !== 11) return `${count} vežba`;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${count} vežbe`;
  return `${count} vežbi`;
}

export function workoutIcon(workout: Workout): string {
  if (workout.tag === 'Kardio') return 'directions_run';
  if (workout.tag === 'Početnik') return 'accessibility_new';
  return 'fitness_center';
}
