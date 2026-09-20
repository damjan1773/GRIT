import { Exercise, SessionSet, Workout, WorkoutSession } from '../types';

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

/** Only ticked sets count, the way a training log totals a session. */
export function sessionVolume(session: WorkoutSession): number {
  return session.exercises.reduce(
    (total, exercise) =>
      total +
      exercise.sets.reduce((sum, set) => sum + (set.done ? (set.weightKg ?? 0) * (set.reps ?? 0) : 0), 0),
    0
  );
}

export function completedSets(session: WorkoutSession): number {
  return session.exercises.reduce((n, exercise) => n + exercise.sets.filter(s => s.done).length, 0);
}

/** "45s", "12:04", "1:05:30". */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const seconds = total % 60;
  const minutes = Math.floor(total / 60) % 60;
  const hours = Math.floor(total / 3600);
  const pad = (n: number) => String(n).padStart(2, '0');
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  if (minutes > 0) return `${minutes}:${pad(seconds)}`;
  return `${seconds}s`;
}

/** The sets logged for this exercise the last time it was trained. */
export function lastSetsFor(sessions: WorkoutSession[], exerciseName: string): SessionSet[] {
  const name = exerciseName.trim().toLowerCase();
  for (const session of sessions) {
    const exercise = session.exercises.find(e => e.name.trim().toLowerCase() === name);
    const done = exercise?.sets.filter(s => s.done) ?? [];
    if (done.length > 0) return done;
  }
  return [];
}

/** "15 kg × 6", or "× 8" for bodyweight. */
export function formatSet(set: SessionSet): string {
  const reps = set.reps ?? 0;
  return set.weightKg ? `${set.weightKg} kg × ${reps}` : `× ${reps}`;
}

export function workoutIcon(workout: Workout): string {
  if (workout.tag === 'Kardio') return 'directions_run';
  if (workout.tag === 'Početnik') return 'accessibility_new';
  return 'fitness_center';
}
