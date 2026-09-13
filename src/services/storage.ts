import AsyncStorage from '@react-native-async-storage/async-storage';
import { Meal, UserProfile } from '../types';

const KEYS = {
  profile: 'nutra:profile',
  meals: 'nutra:meals',
};

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.profile, JSON.stringify(profile));
}

/** Profiles saved before the name field existed fall back to this. */
export const DEFAULT_USER_NAME = 'Korisnik';

export async function loadProfile(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(KEYS.profile);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as UserProfile;
  return {
    ...parsed,
    name: parsed.name?.trim() || DEFAULT_USER_NAME,
    // Saved before goals existed: those targets were plain maintenance.
    calorieAdjustment: typeof parsed.calorieAdjustment === 'number' ? parsed.calorieAdjustment : 0,
  };
}

export async function loadMeals(): Promise<Meal[]> {
  const raw = await AsyncStorage.getItem(KEYS.meals);
  return raw ? (JSON.parse(raw) as Meal[]) : [];
}

export async function addMeal(meal: Meal): Promise<Meal[]> {
  const meals = await loadMeals();
  const updated = [meal, ...meals];
  await AsyncStorage.setItem(KEYS.meals, JSON.stringify(updated));
  return updated;
}

/** Removes a single entry, matched by index so legacy duplicate ids can't take
 * more than one row with them. */
export async function deleteMeal(id: string): Promise<Meal[]> {
  const meals = await loadMeals();
  const index = meals.findIndex(m => m.id === id);
  if (index === -1) return meals;
  const updated = meals.slice(0, index).concat(meals.slice(index + 1));
  await AsyncStorage.setItem(KEYS.meals, JSON.stringify(updated));
  return updated;
}

/** Unique across app restarts, unlike a plain in-memory counter. */
export function createMealId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function loadMealsForDate(dateKey: string): Promise<Meal[]> {
  const meals = await loadMeals();
  return meals.filter(m => m.dateKey === dateKey);
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.profile, KEYS.meals]);
}
