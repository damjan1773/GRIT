import AsyncStorage from '@react-native-async-storage/async-storage';
import { Meal, UserProfile } from '../types';

const KEYS = {
  profile: 'nutra:profile',
  meals: 'nutra:meals',
};

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.profile, JSON.stringify(profile));
}

export async function loadProfile(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(KEYS.profile);
  return raw ? (JSON.parse(raw) as UserProfile) : null;
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

export function todayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export async function loadMealsForDate(dateKey: string): Promise<Meal[]> {
  const meals = await loadMeals();
  return meals.filter(m => m.dateKey === dateKey);
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.profile, KEYS.meals]);
}
