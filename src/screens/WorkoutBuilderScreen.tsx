import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, softGradientColors } from '../theme/colors';
import { Theme } from '../theme/theme';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { Icon } from '../components/Icon';
import { GradientButton } from '../components/GradientButton';
import { createId } from '../services/storage';
import { Exercise, ExerciseUnit, Workout } from '../types';

/** Common lifts, so a workout can be put together without typing every name. */
const QUICK_ADD: { name: string; reps: number; unit: ExerciseUnit }[] = [
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

const SETS = { min: 1, max: 10 };
/** Timed holds move in 5 s steps; switching unit starts from a sensible default. */
const REPS: Record<ExerciseUnit, { min: number; max: number; step: number; start: number }> = {
  reps: { min: 1, max: 100, step: 1, start: 10 },
  sec: { min: 5, max: 600, step: 5, start: 30 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function blankExercise(): Exercise {
  return { id: createId(), name: '', sets: 3, reps: REPS.reps.start, unit: 'reps' };
}

interface WorkoutBuilderScreenProps {
  /** A saved workout to edit, or a built-in one to start a copy from. */
  base?: Workout;
  onCancel: () => void;
  onSave: (workout: Workout) => Promise<void>;
}

export function WorkoutBuilderScreen({ base, onCancel, onSave }: WorkoutBuilderScreenProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const scrollRef = useRef<ScrollView>(null);
  const editing = !!base && !base.builtIn;

  const [name, setName] = useState(base?.name ?? '');
  const [exercises, setExercises] = useState<Exercise[]>(() =>
    base ? base.exercises.map(e => ({ ...e, id: createId() })) : [blankExercise()]
  );
  const [focusId, setFocusId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Rows left without a name are dropped on save rather than blocking it.
  const named = exercises.filter(e => e.name.trim());
  const canSave = !!name.trim() && named.length > 0 && !saving;

  function update(id: string, patch: Partial<Exercise>) {
    setExercises(list => list.map(e => (e.id === id ? { ...e, ...patch } : e)));
  }

  function remove(id: string) {
    setExercises(list => list.filter(e => e.id !== id));
  }

  function add(preset?: (typeof QUICK_ADD)[number]) {
    const exercise: Exercise = preset
      ? { id: createId(), name: preset.name, sets: 3, reps: preset.reps, unit: preset.unit }
      : blankExercise();
    setExercises(list => [...list, exercise]);
    // A blank row goes straight to its name field; a preset is already complete.
    if (!preset) setFocusId(exercise.id);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }

  function toggleUnit(exercise: Exercise) {
    const unit: ExerciseUnit = exercise.unit === 'reps' ? 'sec' : 'reps';
    update(exercise.id, { unit, reps: REPS[unit].start });
  }

  async function save() {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave({
        id: editing ? base.id : createId(),
        name: name.trim(),
        tag: 'Moj',
        builtIn: false,
        updatedAt: Date.now(),
        exercises: named.map(e => ({ ...e, name: e.name.trim() })),
      });
    } finally {
      setSaving(false);
    }
  }

  const title = editing ? 'Izmeni trening' : base ? 'Prilagodi trening' : 'Novi trening';
  const subtitle = editing
    ? 'Promene se čuvaju u tvom treningu.'
    : base
      ? `Tvoja kopija treninga „${base.name}“`
      : 'Sastavi trening od vežbi koje radiš.';

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <View style={styles.header}>
        <Pressable onPress={onCancel} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Otkaži">
          <Icon name="close" size={20} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>

      <ScrollView ref={scrollRef} style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.fieldLabel}>NAZIV</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="npr. Grudi i triceps"
          placeholderTextColor={theme.ink(0.3)}
          style={styles.nameInput}
          maxLength={40}
        />

        <Text style={styles.fieldLabel}>VEŽBE</Text>
        <View style={styles.exList}>
          {exercises.map((exercise, i) => {
            const limits = REPS[exercise.unit];
            return (
              <View key={exercise.id} style={styles.exCard}>
                <View style={styles.exTop}>
                  <View style={styles.exIndex}>
                    <Text style={styles.exIndexText}>{i + 1}</Text>
                  </View>
                  <TextInput
                    value={exercise.name}
                    onChangeText={text => update(exercise.id, { name: text })}
                    placeholder="Naziv vežbe"
                    placeholderTextColor={theme.ink(0.3)}
                    style={styles.exNameInput}
                    autoFocus={exercise.id === focusId}
                    maxLength={40}
                  />
                  <Pressable
                    onPress={() => remove(exercise.id)}
                    hitSlop={8}
                    style={styles.removeBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Ukloni vežbu"
                  >
                    <Icon name="close" size={16} color={theme.ink(0.5)} />
                  </Pressable>
                </View>
                <View style={styles.exBottom}>
                  <MiniStepper
                    label="SERIJE"
                    value={exercise.sets}
                    onChange={delta => update(exercise.id, { sets: clamp(exercise.sets + delta, SETS.min, SETS.max) })}
                  />
                  <MiniStepper
                    label={exercise.unit === 'reps' ? 'PONAVLJANJA' : 'SEKUNDE'}
                    value={exercise.reps}
                    onChange={delta =>
                      update(exercise.id, { reps: clamp(exercise.reps + delta * limits.step, limits.min, limits.max) })
                    }
                    onLabelPress={() => toggleUnit(exercise)}
                  />
                </View>
              </View>
            );
          })}
          {exercises.length === 0 && <Text style={styles.emptyHint}>Dodaj bar jednu vežbu.</Text>}
        </View>

        <Pressable onPress={() => add()} style={styles.addBtn} accessibilityRole="button">
          <Icon name="add" size={18} color={theme.text} />
          <Text style={styles.addText}>Dodaj vežbu</Text>
        </Pressable>

        <Text style={[styles.fieldLabel, styles.quickLabel]}>BRZO DODAJ</Text>
        <View style={styles.chips}>
          {QUICK_ADD.map(preset => (
            <Pressable key={preset.name} onPress={() => add(preset)} style={styles.chip} accessibilityRole="button">
              <Icon name="add" size={14} color={colors.mint} />
              <Text style={styles.chipText}>{preset.name}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton label={saving ? 'Čuvam…' : 'Sačuvaj trening'} onPress={save} disabled={!canSave} />
      </View>
    </KeyboardAvoidingView>
  );
}

interface MiniStepperProps {
  label: string;
  value: number;
  onChange: (delta: 1 | -1) => void;
  /** Makes the label a toggle — used to switch between repetitions and seconds. */
  onLabelPress?: () => void;
}

function MiniStepper({ label, value, onChange, onLabelPress }: MiniStepperProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const labelText = <Text style={styles.stepperLabel}>{label}</Text>;
  return (
    <View style={styles.stepperCol}>
      {onLabelPress ? (
        <Pressable
          onPress={onLabelPress}
          hitSlop={6}
          style={styles.stepperLabelRow}
          accessibilityRole="button"
          accessibilityLabel="Promeni ponavljanja ili sekunde"
        >
          {labelText}
          <Icon name="swap_horiz" size={13} color={colors.mint} />
        </Pressable>
      ) : (
        <View style={styles.stepperLabelRow}>{labelText}</View>
      )}
      <View style={styles.stepper}>
        <Pressable onPress={() => onChange(-1)} style={styles.stepBtn} accessibilityRole="button" accessibilityLabel={`Manje: ${label}`}>
          <Icon name="remove" size={15} color={theme.text} />
        </Pressable>
        <Text style={styles.stepValue}>{value}</Text>
        <Pressable onPress={() => onChange(1)} style={styles.stepBtn} accessibilityRole="button" accessibilityLabel={`Više: ${label}`}>
          <Icon name="add" size={15} color={theme.text} />
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    header: {
      paddingTop: 58,
      paddingHorizontal: 20,
      paddingBottom: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.ink(0.06),
    },
    backBtn: { width: 38, height: 38, borderRadius: 13, borderWidth: 1, borderColor: t.ink(0.12), alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 16, color: t.text },
    headerSub: { fontFamily: 'Poppins_400Regular', fontSize: 11.5, color: t.ink(0.42), marginTop: 1 },
    body: { flex: 1 },
    bodyContent: { padding: 20, paddingBottom: 28 },
    fieldLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 11, letterSpacing: 2, color: t.ink(0.38), marginBottom: 10 },
    quickLabel: { marginTop: 22 },
    nameInput: {
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.ink(0.07),
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 22,
      color: t.text,
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 15,
    },
    exList: { gap: 10 },
    exCard: { backgroundColor: t.surface, borderWidth: 1, borderColor: t.ink(0.07), borderRadius: 22, padding: 14, gap: 12 },
    exTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    exIndex: {
      width: 28,
      height: 28,
      borderRadius: 9,
      backgroundColor: softGradientColors[0],
      alignItems: 'center',
      justifyContent: 'center',
    },
    exIndexText: { fontFamily: 'Poppins_700Bold', fontSize: 12, color: colors.mint },
    exNameInput: { flex: 1, minWidth: 0, color: t.text, fontFamily: 'Poppins_600SemiBold', fontSize: 14, paddingVertical: 6 },
    removeBtn: { width: 28, height: 28, borderRadius: 10, backgroundColor: t.ink(0.06), alignItems: 'center', justifyContent: 'center' },
    exBottom: { flexDirection: 'row', gap: 10 },
    stepperCol: { flex: 1, gap: 6 },
    stepperLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 16 },
    stepperLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 9.5, letterSpacing: 1, color: t.ink(0.45) },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: t.bg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.ink(0.07),
      padding: 4,
    },
    stepBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: t.ink(0.06), alignItems: 'center', justifyContent: 'center' },
    stepValue: { minWidth: 40, textAlign: 'center', fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 16, color: t.text },
    emptyHint: { fontFamily: 'Poppins_400Regular', fontSize: 12.5, color: t.ink(0.45) },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 12,
      height: 46,
      borderRadius: 23,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: t.ink(0.2),
    },
    addText: { fontFamily: 'Poppins_600SemiBold', fontSize: 13.5, color: t.text },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 99,
      borderWidth: 1,
      borderColor: t.ink(0.13),
    },
    chipText: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: t.ink(0.75) },
    footer: { borderTopWidth: 1, borderTopColor: t.ink(0.06), paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 },
  });
