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

export interface Meal extends MealMacros {
  id: string;
  name: string;
  timestamp: number;
  dateKey: string;
}
