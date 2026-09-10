import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Meal, UserProfile } from '../types';
import {
  addMeal as addMealToStorage,
  deleteMeal as deleteMealFromStorage,
  loadMeals,
  loadProfile,
  saveProfile,
  todayKey,
} from '../services/storage';

interface AppDataContextValue {
  profile: UserProfile | null;
  todaysMeals: Meal[];
  loading: boolean;
  setProfile: (profile: UserProfile) => Promise<void>;
  addMeal: (meal: Meal) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [p, m] = await Promise.all([loadProfile(), loadMeals()]);
      setProfileState(p);
      setMeals(m);
      setLoading(false);
    })();
  }, []);

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

  const todaysMeals = useMemo(() => {
    const key = todayKey();
    return meals.filter(m => m.dateKey === key);
  }, [meals]);

  const value = useMemo(
    () => ({ profile, todaysMeals, loading, setProfile, addMeal, deleteMeal }),
    [profile, todaysMeals, loading, setProfile, addMeal, deleteMeal]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
