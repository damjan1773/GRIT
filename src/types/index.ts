export type Sex = 'f' | 'm';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';

export interface ActivityOption {
  id: ActivityLevel;
  name: string;
  subtitle: string;
  multiplier: number;
}

export interface UserProfile {
  name: string;
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;
  activity: ActivityLevel;
  /** Daily kcal offset from TDEE: negative cuts, positive bulks, 0 maintains. */
  calorieAdjustment: number;
  bmr: number;
  tdee: number;
  targetCalories: number;
  macroGoals: {
    protein: number;
    carbs: number;
    fats: number;
  };
}

export interface MealMacros {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

/** Most exercises count repetitions; holds such as a plank are timed in seconds. */
export type ExerciseUnit = 'reps' | 'sec';

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  /** Repetitions per set, or seconds per set when unit is 'sec'. */
  reps: number;
  unit: ExerciseUnit;
}

export interface Workout {
  id: string;
  name: string;
  /** Short category shown on the card, e.g. "Snaga". */
  tag: string;
  exercises: Exercise[];
  /** Ships with the app and can't be edited — only copied into a workout of your own. */
  builtIn: boolean;
  updatedAt: number;
}

export interface Meal extends MealMacros {
  id: string;
  name: string;
  timestamp: number;
  dateKey: string;
}
