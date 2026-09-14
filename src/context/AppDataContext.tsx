import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Meal, UserProfile, Workout } from '../types';
import {
  addMeal as addMealToStorage,
  deleteMeal as deleteMealFromStorage,
  deleteWorkout as deleteWorkoutFromStorage,
  loadMeals,
  loadProfile,
  loadWorkouts,
  saveProfile,
  saveWorkout as saveWorkoutToStorage,
} from '../services/storage';
import { toDateKey } from '../utils/dates';

/** How often a running app looks for the date having turned over. */
const DAY_CHECK_INTERVAL_MS = 30_000;
/** A picked day is dropped after a break this long, so the app reopens on today. */
const RETURN_TO_TODAY_AFTER_MS = 10 * 60_000;

interface AppDataContextValue {
  profile: UserProfile | null;
  /** The real calendar date right now. */
  todayKey: string;
  /** The day being viewed and logged to — today unless picked otherwise. */
  selectedDateKey: string;
  setSelectedDateKey: (dateKey: string) => void;
  /** Meals logged to the selected day. */
  dayMeals: Meal[];
  loading: boolean;
  setProfile: (profile: UserProfile) => Promise<void>;
  addMeal: (meal: Meal) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  /** Workouts the user made; built-in ones are in data/builtInWorkouts. */
  workouts: Workout[];
  saveWorkout: (workout: Workout) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayKey, setTodayKey] = useState(() => toDateKey(new Date()));
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const todayRef = useRef(todayKey);
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      const [p, m, w] = await Promise.all([loadProfile(), loadMeals(), loadWorkouts()]);
      setProfileState(p);
      setMeals(m);
      setWorkouts(w);
      setLoading(false);
    })();
  }, []);

  const goToToday = useCallback(() => {
    const now = toDateKey(new Date());
    todayRef.current = now;
    setTodayKey(now);
    setSelectedDateKey(now);
  }, []);

  useEffect(() => {
    // At midnight the app moves on to the new day.
    const interval = setInterval(() => {
      if (toDateKey(new Date()) !== todayRef.current) goToToday();
    }, DAY_CHECK_INTERVAL_MS);

    // Intervals don't run in the background, so check again on return. A long
    // break also drops a picked day: someone who logged a late snack to
    // yesterday shouldn't find breakfast going there the next morning.
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'background') {
        backgroundedAt.current = Date.now();
      } else if (state === 'active') {
        const away = backgroundedAt.current === null ? 0 : Date.now() - backgroundedAt.current;
        backgroundedAt.current = null;
        if (away > RETURN_TO_TODAY_AFTER_MS || toDateKey(new Date()) !== todayRef.current) goToToday();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [goToToday]);

  const setProfile = useCallback(async (next: UserProfile) => {
    await saveProfile(next);
    setProfileState(next);
  }, []);

  const addMeal = useCallback(async (meal: Meal) => {
    const updated = await addMealToStorage(meal);
    setMeals(updated);
  }, []);

  const deleteMeal = useCallback(async (id: string) => {
    const updated = await deleteMealFromStorage(id);
    setMeals(updated);
  }, []);

  const saveWorkout = useCallback(async (workout: Workout) => {
    const updated = await saveWorkoutToStorage(workout);
    setWorkouts(updated);
  }, []);

  const deleteWorkout = useCallback(async (id: string) => {
    const updated = await deleteWorkoutFromStorage(id);
    setWorkouts(updated);
  }, []);

  const dayMeals = useMemo(() => meals.filter(m => m.dateKey === selectedDateKey), [meals, selectedDateKey]);

  const value = useMemo(
    () => ({
      profile,
      todayKey,
      selectedDateKey,
      setSelectedDateKey,
      dayMeals,
      loading,
      setProfile,
      addMeal,
      deleteMeal,
      workouts,
      saveWorkout,
      deleteWorkout,
    }),
    [profile, todayKey, selectedDateKey, dayMeals, loading, setProfile, addMeal, deleteMeal, workouts, saveWorkout, deleteWorkout]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
