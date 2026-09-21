import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { Theme, whiteChipEdge } from '../theme/theme';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { Icon } from '../components/Icon';
import { GradientButton } from '../components/GradientButton';
import { useAppData } from '../context/AppDataContext';
import { COMMON_EXERCISES } from '../data/commonExercises';
import { createId } from '../services/storage';
import { SessionExercise, SessionSet, WorkoutSession } from '../types';
import { formatDuration, formatSet, lastSetsFor, sessionVolume } from '../utils/workouts';

/** How long the "tap again to discard" prompt stays armed. */
const CONFIRM_WINDOW_MS = 4000;

/** Rest lengths offered between sets, in seconds. */
const REST_OPTIONS = [60, 90, 120, 180];
const DEFAULT_REST_SECONDS = 90;
const REST_NUDGE_SECONDS = 15;
/** How long "rest over" stays on the tile before it goes back to idle. */
const REST_DONE_VISIBLE_MS = 8000;

/** "1:30" — a countdown always shows minutes, and rounds up so it never sits on 0:00 early. */
function countdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

interface WorkoutSessionScreenProps {
  session: WorkoutSession;
  /** Leaves the session running and goes back to the list. */
  onMinimize: () => void;
}

function blankSet(): SessionSet {
  return { id: createId(), weightKg: null, reps: null, done: false };
}

function parseNumber(text: string): number | null {
  const cleaned = text.replace(',', '.').trim();
  if (!cleaned) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function WorkoutSessionScreen({ session, onMinimize }: WorkoutSessionScreenProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { sessions, updateSession, finishSession, discardSession } = useAppData();
  const [now, setNow] = useState(Date.now());
  const [addingExercise, setAddingExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const [restPanelOpen, setRestPanelOpen] = useState(false);

  // Both clocks are derived from timestamps, so they stay right after the app is
  // backgrounded. Half-second ticks keep the countdown from skipping a second.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

  const restSeconds = session.restSeconds ?? DEFAULT_REST_SECONDS;
  const restEndsAt = session.restEndsAt ?? null;
  const restLeft = restEndsAt === null ? null : restEndsAt - now;
  const resting = restLeft !== null && restLeft > 0;
  const restOver = restLeft !== null && restLeft <= 0;

  // One buzz when the rest runs out — but not for a rest that ended long ago,
  // e.g. while the app was closed.
  const buzzedFor = useRef<number | null>(null);
  useEffect(() => {
    if (!restOver || restEndsAt === null || buzzedFor.current === restEndsAt) return;
    buzzedFor.current = restEndsAt;
    setRestPanelOpen(false);
    if (Date.now() - restEndsAt < 3000) Vibration.vibrate([0, 400, 200, 400]);
  }, [restOver, restEndsAt]);

  useEffect(() => {
    if (restOver && restLeft !== null && -restLeft > REST_DONE_VISIBLE_MS) {
      updateSession({ ...session, restEndsAt: null });
    }
  }, [restOver, restLeft, session, updateSession]);

  function startRest(seconds: number) {
    const start = Date.now();
    setNow(start);
    updateSession({ ...session, restSeconds: seconds, restEndsAt: start + seconds * 1000 });
    setRestPanelOpen(false);
  }

  function nudgeRest(seconds: number) {
    if (restEndsAt === null) return;
    // Never below a second left, so a nudge can't end the rest by itself.
    updateSession({ ...session, restEndsAt: Math.max(Date.now() + 1000, restEndsAt + seconds * 1000) });
  }

  function stopRest() {
    updateSession({ ...session, restEndsAt: null });
    setRestPanelOpen(false);
  }

  useEffect(() => {
    if (!confirmingDiscard) return;
    const timer = setTimeout(() => setConfirmingDiscard(false), CONFIRM_WINDOW_MS);
    return () => clearTimeout(timer);
  }, [confirmingDiscard]);

  /** What was lifted for each exercise last time, set by set. */
  const history = useMemo(() => {
    const map: Record<string, SessionSet[]> = {};
    session.exercises.forEach(exercise => {
      map[exercise.id] = lastSetsFor(sessions, exercise.name);
    });
    return map;
  }, [sessions, session.exercises]);

  function patch(exercises: SessionExercise[]) {
    updateSession({ ...session, exercises });
  }

  function patchExercise(exerciseId: string, update: (exercise: SessionExercise) => SessionExercise) {
    patch(session.exercises.map(e => (e.id === exerciseId ? update(e) : e)));
  }

  function patchSet(exerciseId: string, setId: string, update: (set: SessionSet) => SessionSet) {
    patchExercise(exerciseId, exercise => ({
      ...exercise,
      sets: exercise.sets.map(s => (s.id === setId ? update(s) : s)),
    }));
  }

  function toggleDone(exercise: SessionExercise, set: SessionSet, index: number) {
    const previous = history[exercise.id]?.[index];
    patchSet(exercise.id, set.id, current =>
      current.done
        ? { ...current, done: false }
        : {
            // Ticking an untouched row keeps the numbers its placeholder was showing.
            ...current,
            weightKg: current.weightKg ?? previous?.weightKg ?? 0,
            reps: current.reps ?? previous?.reps ?? exercise.targetReps ?? 0,
            done: true,
          }
    );
  }

  function addExercise(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    patch([
      ...session.exercises,
      { id: createId(), name: trimmed, targetReps: null, sets: [blankSet()] },
    ]);
    setNewExerciseName('');
    setAddingExercise(false);
  }

  const volume = sessionVolume(session);
  const restFraction = resting ? Math.min(1, restLeft / (restSeconds * 1000)) : 0;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <View style={styles.header}>
        <Pressable onPress={onMinimize} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Nazad na listu">
          <Icon name="arrow_back" size={19} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {session.workoutName}
          </Text>
          <Text style={styles.headerSub}>trening u toku</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: colors.mint }]}>
          <Text style={styles.statValue}>{formatDuration(now - session.startedAt)}</Text>
          <Text style={styles.statLabel}>TRAJANJE</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.lav }]}>
          <Text style={styles.statValue}>{Math.round(volume).toLocaleString('sr-RS')}</Text>
          <Text style={styles.statLabel}>KG VOLUMEN</Text>
        </View>
        <Pressable
          onPress={() => (restOver ? stopRest() : setRestPanelOpen(open => !open))}
          style={[
            styles.statBox,
            styles.restBox,
            restOver ? { backgroundColor: colors.mint } : [{ backgroundColor: colors.white }, whiteChipEdge(theme)],
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            resting
              ? `Odmor, još ${countdown(restLeft)}. Dodirni za izmenu.`
              : restOver
                ? 'Odmor je gotov'
                : 'Tajmer za odmor između serija'
          }
        >
          <View style={styles.restValueRow}>
            {!resting && !restOver && <Icon name="timer" size={16} color="#101012" />}
            <Text style={styles.statValue}>
              {resting ? countdown(restLeft) : restOver ? 'Kreni!' : countdown(restSeconds * 1000)}
            </Text>
          </View>
          <Text style={styles.statLabel}>{restOver ? 'ODMOR GOTOV' : 'ODMOR'}</Text>
          {resting && (
            <View style={styles.restTrack}>
              <View style={[styles.restFill, { width: `${restFraction * 100}%` }]} />
            </View>
          )}
        </Pressable>
      </View>

      {restPanelOpen && (
        <View style={styles.restPanel}>
          <Text style={styles.restPanelTitle}>{resting ? 'Odmor u toku' : 'Koliko odmaraš?'}</Text>
          <View style={styles.restOptions}>
            {REST_OPTIONS.map(seconds => {
              const picked = seconds === restSeconds;
              return (
                <Pressable
                  key={seconds}
                  onPress={() => startRest(seconds)}
                  style={[styles.restOption, picked && styles.restOptionPicked]}
                  accessibilityRole="button"
                  accessibilityLabel={`Odmor ${countdown(seconds * 1000)}${resting ? ', počni ponovo' : ''}`}
                >
                  <Text style={[styles.restOptionText, picked && styles.restOptionTextPicked]}>
                    {countdown(seconds * 1000)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {resting && (
            <View style={styles.restActions}>
              <Pressable onPress={() => nudgeRest(-REST_NUDGE_SECONDS)} style={styles.smallBtn} accessibilityRole="button">
                <Text style={styles.smallBtnText}>−15 s</Text>
              </Pressable>
              <Pressable onPress={() => nudgeRest(REST_NUDGE_SECONDS)} style={styles.smallBtn} accessibilityRole="button">
                <Text style={styles.smallBtnText}>+15 s</Text>
              </Pressable>
              <Pressable onPress={stopRest} style={[styles.smallBtn, styles.restStop]} accessibilityRole="button">
                <Text style={styles.smallBtnText}>Prekini</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
        {session.exercises.map(exercise => (
          <View key={exercise.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName} numberOfLines={1}>
                {exercise.name}
              </Text>
              <Pressable
                onPress={() => patch(session.exercises.filter(e => e.id !== exercise.id))}
                hitSlop={8}
                style={styles.removeBtn}
                accessibilityRole="button"
                accessibilityLabel={`Ukloni vežbu: ${exercise.name}`}
              >
                <Icon name="close" size={15} color={theme.ink(0.5)} />
              </Pressable>
            </View>

            <View style={styles.tableHead}>
              <Text style={[styles.headCell, styles.colSet]}>SER</Text>
              <Text style={[styles.headCell, styles.colPrev]}>PRETHODNO</Text>
              <Text style={[styles.headCell, styles.colInput]}>KG</Text>
              <Text style={[styles.headCell, styles.colInput]}>PON</Text>
              <View style={styles.colCheck} />
            </View>

            {exercise.sets.map((set, index) => {
              const previous = history[exercise.id]?.[index];
              const repsPlaceholder = previous?.reps ?? exercise.targetReps;
              return (
                <View key={set.id} style={[styles.setRow, set.done && styles.setRowDone]}>
                  <View style={styles.colSet}>
                    <Text style={styles.setNumber}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.prevText, styles.colPrev]} numberOfLines={1}>
                    {previous ? formatSet(previous) : '—'}
                  </Text>
                  <TextInput
                    style={[styles.input, styles.colInput]}
                    value={set.weightKg === null ? '' : String(set.weightKg)}
                    onChangeText={text => patchSet(exercise.id, set.id, s => ({ ...s, weightKg: parseNumber(text) }))}
                    placeholder={previous?.weightKg != null ? String(previous.weightKg) : '0'}
                    placeholderTextColor={theme.ink(0.3)}
                    keyboardType="decimal-pad"
                    maxLength={5}
                    accessibilityLabel={`Kilaža, serija ${index + 1}`}
                  />
                  <TextInput
                    style={[styles.input, styles.colInput]}
                    value={set.reps === null ? '' : String(set.reps)}
                    onChangeText={text => patchSet(exercise.id, set.id, s => ({ ...s, reps: parseNumber(text) }))}
                    placeholder={repsPlaceholder != null ? String(repsPlaceholder) : '0'}
                    placeholderTextColor={theme.ink(0.3)}
                    keyboardType="number-pad"
                    maxLength={3}
                    accessibilityLabel={`Ponavljanja, serija ${index + 1}`}
                  />
                  <Pressable
                    onPress={() => toggleDone(exercise, set, index)}
                    style={[styles.checkBtn, set.done && styles.checkBtnDone, styles.colCheck]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: set.done }}
                    accessibilityLabel={`Serija ${index + 1}: ${exercise.name}`}
                  >
                    <Icon name="check" size={17} color={set.done ? '#101012' : theme.ink(0.4)} />
                  </Pressable>
                </View>
              );
            })}

            <View style={styles.exerciseActions}>
              <Pressable
                onPress={() => patchExercise(exercise.id, e => ({ ...e, sets: [...e.sets, blankSet()] }))}
                style={styles.smallBtn}
                accessibilityRole="button"
              >
                <Icon name="add" size={15} color={theme.text} />
                <Text style={styles.smallBtnText}>Serija</Text>
              </Pressable>
              {exercise.sets.length > 1 && (
                <Pressable
                  onPress={() => patchExercise(exercise.id, e => ({ ...e, sets: e.sets.slice(0, -1) }))}
                  style={styles.smallBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Obriši poslednju seriju"
                >
                  <Icon name="remove" size={15} color={theme.text} />
                  <Text style={styles.smallBtnText}>Poslednja</Text>
                </Pressable>
              )}
            </View>
          </View>
        ))}

        {addingExercise ? (
          <View style={styles.addPanel}>
            <TextInput
              value={newExerciseName}
              onChangeText={setNewExerciseName}
              onSubmitEditing={() => addExercise(newExerciseName)}
              placeholder="Naziv vežbe"
              placeholderTextColor={theme.ink(0.3)}
              style={styles.addInput}
              autoFocus
              maxLength={40}
            />
            <View style={styles.chips}>
              {COMMON_EXERCISES.map(preset => (
                <Pressable key={preset.name} onPress={() => addExercise(preset.name)} style={styles.chip} accessibilityRole="button">
                  <Icon name="add" size={13} color={theme.accent} />
                  <Text style={styles.chipText}>{preset.name}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.addActions}>
              <Pressable
                onPress={() => {
                  setAddingExercise(false);
                  setNewExerciseName('');
                }}
                style={styles.smallBtn}
                accessibilityRole="button"
              >
                <Text style={styles.smallBtnText}>Otkaži</Text>
              </Pressable>
              <Pressable onPress={() => addExercise(newExerciseName)} style={styles.smallBtn} accessibilityRole="button">
                <Icon name="check" size={15} color={theme.accent} />
                <Text style={styles.smallBtnText}>Dodaj</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable onPress={() => setAddingExercise(true)} style={styles.addBtn} accessibilityRole="button">
            <Icon name="add" size={18} color={theme.text} />
            <Text style={styles.addText}>Dodaj vežbu</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* With the tab bar hidden, the footer sits on the home indicator — clear it. */}
      <View style={[styles.footer, { paddingBottom: 12 + insets.bottom }]}>
        <GradientButton label="Završi trening" onPress={finishSession} style={styles.finishBtn} />
        <View>
          {confirmingDiscard && (
            // Floats above the button, so arming it doesn't shift the layout.
            <View style={styles.discardHint} pointerEvents="none">
              <Text style={styles.discardHintText} numberOfLines={1}>
                Dodirni ponovo
              </Text>
            </View>
          )}
          <Pressable
            onPress={() => (confirmingDiscard ? discardSession() : setConfirmingDiscard(true))}
            style={[styles.discardBtn, confirmingDiscard && styles.discardBtnArmed]}
            accessibilityRole="button"
            accessibilityLabel={confirmingDiscard ? 'Potvrdi: odbaci trening' : 'Odbaci trening'}
          >
            <Icon name="delete_outline" size={22} color={confirmingDiscard ? '#101012' : '#FF6B6B'} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    header: {
      paddingTop: 58,
      paddingHorizontal: 16,
      paddingBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    backBtn: { width: 38, height: 38, borderRadius: 13, borderWidth: 1, borderColor: t.ink(0.12), alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 17, color: t.text },
    headerSub: { fontFamily: 'Poppins_500Medium', fontSize: 11.5, color: t.accent, marginTop: 1 },
    statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 14 },
    statBox: { flex: 1, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 18 },
    statValue: { fontFamily: 'Poppins_900Black_Italic', fontSize: 19, color: '#101012' },
    statLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 8.5, letterSpacing: 1, color: '#101012', opacity: 0.6, marginTop: 3 },
    restBox: { overflow: 'hidden' },
    restValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    // Drains as the rest runs down, along the tile's bottom edge.
    restTrack: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, backgroundColor: 'rgba(16,16,18,0.1)' },
    restFill: { height: '100%', backgroundColor: 'rgba(16,16,18,0.55)' },
    restPanel: {
      marginHorizontal: 16,
      marginBottom: 14,
      padding: 14,
      gap: 10,
      borderRadius: 22,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.ink(0.07),
    },
    restPanelTitle: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: t.text },
    restOptions: { flexDirection: 'row', gap: 8 },
    restOption: {
      flex: 1,
      height: 42,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.ink(0.13),
      alignItems: 'center',
      justifyContent: 'center',
    },
    restOptionPicked: { backgroundColor: colors.mint, borderColor: colors.mint },
    restOptionText: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 15, color: t.text },
    restOptionTextPicked: { color: '#101012' },
    restActions: { flexDirection: 'row', gap: 8 },
    restStop: { marginLeft: 'auto' },
    body: { flex: 1 },
    bodyContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
    exerciseCard: { backgroundColor: t.surface, borderWidth: 1, borderColor: t.ink(0.07), borderRadius: 22, padding: 12 },
    exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    exerciseName: { flex: 1, fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 15, color: t.text },
    removeBtn: { width: 26, height: 26, borderRadius: 9, backgroundColor: t.ink(0.06), alignItems: 'center', justifyContent: 'center' },
    tableHead: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 6 },
    headCell: { fontFamily: 'Poppins_600SemiBold', fontSize: 8.5, letterSpacing: 1, color: t.ink(0.4) },
    colSet: { width: 22, textAlign: 'center' },
    colPrev: { flex: 1, minWidth: 0 },
    colInput: { width: 52 },
    colCheck: { width: 38 },
    setRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 5,
      paddingHorizontal: 4,
      marginHorizontal: -4,
      borderRadius: 12,
    },
    setRowDone: { backgroundColor: 'rgba(143,233,206,0.13)' },
    setNumber: { fontFamily: 'Poppins_700Bold', fontSize: 12.5, color: t.ink(0.6), textAlign: 'center' },
    prevText: { fontFamily: 'Poppins_500Medium', fontSize: 11.5, color: t.ink(0.45) },
    input: {
      height: 36,
      borderRadius: 11,
      backgroundColor: t.bg,
      borderWidth: 1,
      borderColor: t.ink(0.09),
      textAlign: 'center',
      color: t.text,
      fontFamily: 'Poppins_700Bold',
      fontSize: 14,
      paddingVertical: 0,
    },
    checkBtn: {
      height: 36,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: t.ink(0.12),
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkBtnDone: { backgroundColor: colors.mint, borderColor: colors.mint },
    exerciseActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
    smallBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingHorizontal: 12,
      height: 34,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: t.ink(0.13),
    },
    smallBtnText: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: t.text },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 46,
      borderRadius: 23,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: t.ink(0.2),
    },
    addText: { fontFamily: 'Poppins_600SemiBold', fontSize: 13.5, color: t.text },
    addPanel: { backgroundColor: t.surface, borderWidth: 1, borderColor: t.ink(0.07), borderRadius: 22, padding: 14, gap: 10 },
    addInput: {
      backgroundColor: t.bg,
      borderWidth: 1,
      borderColor: t.ink(0.09),
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      color: t.text,
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 14,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 99,
      borderWidth: 1,
      borderColor: t.ink(0.13),
    },
    chipText: { fontFamily: 'Poppins_500Medium', fontSize: 11.5, color: t.ink(0.75) },
    addActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderTopWidth: 1,
      borderTopColor: t.ink(0.06),
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    finishBtn: { flex: 1 },
    discardBtn: {
      width: 58,
      height: 58,
      borderRadius: 29,
      borderWidth: 1.5,
      borderColor: 'rgba(255,107,107,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    discardBtnArmed: { backgroundColor: '#FF6B6B', borderColor: '#FF6B6B' },
    discardHint: {
      position: 'absolute',
      bottom: 66,
      right: 0,
      // Its own width: otherwise it is squeezed to the button's 58px and wraps.
      width: 120,
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 99,
      backgroundColor: '#FF6B6B',
    },
    discardHintText: { fontFamily: 'Poppins_700Bold', fontSize: 11, color: '#101012' },
  });
