import { ExerciseUnit } from '../types';

/** Common lifts, so a workout can be put together without typing every name. */
export const COMMON_EXERCISES: { name: string; reps: number; unit: ExerciseUnit }[] = [
  { name: 'Čučanj', reps: 10, unit: 'reps' },
  { name: 'Bench press', reps: 8, unit: 'reps' },
  { name: 'Mrtvo dizanje', reps: 5, unit: 'reps' },
  { name: 'Zgibovi', reps: 8, unit: 'reps' },
  { name: 'Sklekovi', reps: 12, unit: 'reps' },
  { name: 'Veslanje bučicom', reps: 10, unit: 'reps' },
  { name: 'Rameni potisak', reps: 10, unit: 'reps' },
  { name: 'Iskoraci', reps: 10, unit: 'reps' },
  { name: 'Plank', reps: 45, unit: 'sec' },
];
