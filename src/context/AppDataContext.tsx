import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Meal, UserProfile, WeightEntry, Workout, WorkoutSession } from '../types';
import {
  addMeal as addMealToStorage,
  appendSession,
  createId,
  deleteMeal as deleteMealFromStorage,
  deleteWeight as deleteWeightFromStorage,
  deleteWorkout as deleteWorkoutFromStorage,
  loadActiveSession,
  loadMeals,
  loadProfile,
  loadSessions,
  loadWeights,
  loadWorkouts,
  saveActiveSession,
  saveProfile,
  saveWeight,
  saveWorkout as saveWorkoutToStorage,
} from '../services/storage';
import { completedSets } from '../utils/workouts';
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
  /** Every meal ever logged — for statistics across days. */
  meals: Meal[];
  loading: boolean;
  setProfile: (profile: UserProfile) => Promise<void>;
  addMeal: (meal: Meal) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  /** Workouts the user made; built-in ones are in data/builtInWorkouts. */
  workouts: Workout[];
  saveWorkout: (workout: Workout) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  /** Finished sessions, newest first — where the "last time" numbers come from. */
  sessions: WorkoutSession[];
  /** The workout being done right now, restored if the app was closed mid-set. */
  activeSession: WorkoutSession | null;
  startSession: (workout: Workout) => Promise<void>;
  updateSession: (session: WorkoutSession) => Promise<void>;
  finishSession: () => Promise<void>;
  discardSession: () => Promise<void>;
  /** Weigh-ins, oldest first, at most one per day. */
  weights: WeightEntry[];
  /** Logs today's weight, replacing an earlier weigh-in from today. */
  logWeight: (kg: number) => Promise<void>;
  deleteWeight: (dateKey: string) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayKey, setTodayKey] = useState(() => toDateKey(new Date()));
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const todayRef = useRef(todayKey);
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      const [p, m, w, s, active, kg] = await Promise.all([
        loadProfile(),
        loadMeals(),
        loadWorkouts(),
        loadSessions(),
        loadActiveSession(),
        loadWeights(),
      ]);
      setWeights(kg);
      setProfileState(p);
      setMeals(m);
      setWorkouts(w);
      setSessions(s);
      setActiveSession(active);
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

  const startSession = useCallback(async (workout: Workout) => {
    const session: WorkoutSession = {
      id: createId(),
      workoutId: workout.id,
      workoutName: workout.name,
      startedAt: Date.now(),
      finishedAt: null,
      exercises: workout.exercises.map(exercise => ({
        id: createId(),
        name: exercise.name,
        targetReps: exercise.unit === 'reps' ? exercise.reps : null,
        sets: Array.from({ length: Math.max(1, exercise.sets) }, () => ({
          id: createId(),
          weightKg: null,
          reps: null,
          done: false,
        })),
      })),
    };
    setActiveSession(session);
    await saveActiveSession(session);
  }, []);

  const updateSession = useCallback(async (session: WorkoutSession) => {
    setActiveSession(session);
    await saveActiveSession(session);
  }, []);

  const discardSession = useCallback(async () => {
    setActiveSession(null);
    await saveActiveSession(null);
  }, []);

  const finishSession = useCallback(async () => {
    setActiveSession(current => {
      if (!current) return null;
      // A session with nothing ticked would only add noise to the history.
      if (completedSets(current) > 0) {
        const finished = { ...current, finishedAt: Date.now(), restEndsAt: null, restStartedAt: null };
        appendSession(finished).then(setSessions);
      }
      saveActiveSession(null);
      return null;
    });
  }, []);

  const logWeight = useCallback(async (kg: number) => {
    // Read the clock rather than todayKey, so a weigh-in just after midnight lands on the new day.
    setWeights(await saveWeight({ dateKey: toDateKey(new Date()), kg }));
  }, []);

  const deleteWeight = useCallback(async (dateKey: string) => {
    setWeights(await deleteWeightFromStorage(dateKey));
  }, []);

  const dayMeals = useMemo(() => meals.filter(m => m.dateKey === selectedDateKey), [meals, selectedDateKey]);

  const value = useMemo(
    () => ({
      profile,
      todayKey,
      selectedDateKey,
      setSelectedDateKey,
      dayMeals,
      meals,
      loading,
      setProfile,
      addMeal,
      deleteMeal,
      workouts,
      saveWorkout,
      deleteWorkout,
      sessions,
      activeSession,
      startSession,
      updateSession,
      finishSession,
      discardSession,
      weights,
      logWeight,
      deleteWeight,
    }),
    [
      profile,
      todayKey,
      selectedDateKey,
      dayMeals,
      meals,
      loading,
      setProfile,
      addMeal,
      deleteMeal,
      workouts,
      saveWorkout,
      deleteWorkout,
      sessions,
      activeSession,
      startSession,
      updateSession,
      finishSession,
      discardSession,
      weights,
      logWeight,
      deleteWeight,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
