import { Exercise, ExerciseUnit, Workout } from '../types';

type ExerciseSpec = [name: string, sets: number, reps: number, unit?: ExerciseUnit];

function workout(slug: string, name: string, tag: string, exercises: ExerciseSpec[]): Workout {
  return {
    id: `builtin-${slug}`,
    name,
    tag,
    builtIn: true,
    updatedAt: 0,
    exercises: exercises.map(
      ([exerciseName, sets, reps, unit = 'reps'], i): Exercise => ({
        id: `builtin-${slug}-${i}`,
        name: exerciseName,
        sets,
        reps,
        unit,
      })
    ),
  };
}

export const BUILT_IN_WORKOUTS: Workout[] = [
  workout('upper', 'Snaga — gornji deo', 'Snaga', [
    ['Bench press', 4, 8],
    ['Veslanje sa šipkom', 4, 8],
    ['Rameni potisak', 3, 10],
    ['Zgibovi', 3, 8],
    ['Pregib za biceps', 3, 12],
    ['Ekstenzija za triceps', 3, 12],
  ]),
  workout('lower', 'Snaga — donji deo', 'Snaga', [
    ['Čučanj', 4, 8],
    ['Rumunsko mrtvo dizanje', 4, 8],
    ['Iskoraci', 3, 10],
    ['Nožna presa', 3, 12],
    ['Podizanje na prste', 4, 15],
    ['Plank', 3, 45, 'sec'],
  ]),
  workout('full-body', 'Celo telo za početnike', 'Početnik', [
    ['Goblet čučanj', 3, 10],
    ['Sklekovi', 3, 10],
    ['Veslanje bučicom', 3, 10],
    ['Glute bridge', 3, 12],
    ['Plank', 3, 30, 'sec'],
  ]),
  workout('push', 'Push — grudi, ramena, triceps', 'Split', [
    ['Bench press', 4, 8],
    ['Kosi potisak bučicama', 3, 10],
    ['Rameni potisak', 3, 10],
    ['Lateralna odručenja', 3, 15],
    ['Propadanja na razboju', 3, 10],
    ['Triceps na sajli', 3, 12],
  ]),
  workout('pull', 'Pull — leđa i biceps', 'Split', [
    ['Mrtvo dizanje', 4, 5],
    ['Zgibovi', 4, 8],
    ['Veslanje na sajli', 3, 10],
    ['Face pull', 3, 15],
    ['Pregib za biceps', 3, 12],
    ['Čekić pregib', 3, 12],
  ]),
  workout('cardio-core', 'Kardio i core', 'Kardio', [
    ['Burpee', 4, 12],
    ['Mountain climbers', 4, 30, 'sec'],
    ['Ruski twist', 3, 20],
    ['Plank', 3, 45, 'sec'],
    ['Preskakanje vijače', 4, 60, 'sec'],
  ]),
];
