import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, softGradientColors } from '../theme/colors';
import { Theme, whiteChipEdge } from '../theme/theme';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { Icon } from '../components/Icon';
import { GradientButton } from '../components/GradientButton';
import { Workout } from '../types';
import { estimateMinutes, formatPrescription, totalSets } from '../utils/workouts';

/** How long the "tap again to delete" prompt stays armed. */
const CONFIRM_WINDOW_MS = 4000;

interface WorkoutDetailScreenProps {
  workout: Workout;
  onBack: () => void;
  /** Edits a saved workout, or starts a copy of a built-in one. */
  onCustomize: () => void;
  onDelete: () => void;
  onStart: () => void;
  /** True while some workout is already running — the button resumes it instead. */
  sessionRunning: boolean;
}

export function WorkoutDetailScreen({
  workout,
  onBack,
  onCustomize,
  onDelete,
  onStart,
  sessionRunning,
}: WorkoutDetailScreenProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Deleting takes a second tap. A native confirm dialog would do, but an
  // inline one behaves the same on every platform.
  useEffect(() => {
    if (!confirmingDelete) return;
    const timer = setTimeout(() => setConfirmingDelete(false), CONFIRM_WINDOW_MS);
    return () => clearTimeout(timer);
  }, [confirmingDelete]);

  const stats = [
    { label: 'VEŽBE', value: `${workout.exercises.length}`, bg: colors.mint },
    { label: 'SERIJE', value: `${totalSets(workout)}`, bg: colors.lav },
    { label: 'MINUTA', value: `~${estimateMinutes(workout)}`, bg: colors.white },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Pressable onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Nazad">
          <Icon name="arrow_back" size={20} color={theme.text} />
        </Pressable>
        <View style={styles.tagPill}>
          <Text style={styles.tagText}>{workout.builtIn ? workout.tag : 'Moj trening'}</Text>
        </View>
      </View>

      <Text style={styles.title}>{workout.name}</Text>

      <View style={styles.statsRow}>
        {stats.map(s => (
          <View key={s.label} style={[styles.statBox, { backgroundColor: s.bg }, s.bg === colors.white && whiteChipEdge(theme)]}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Vežbe</Text>
      <View style={styles.card}>
        {workout.exercises.map((exercise, i) => (
          <View key={exercise.id} style={[styles.exRow, i === 0 && styles.exRowFirst]}>
            <View style={styles.exIndex}>
              <Text style={styles.exIndexText}>{i + 1}</Text>
            </View>
            <Text style={styles.exName}>{exercise.name}</Text>
            <Text style={styles.exPrescription}>{formatPrescription(exercise)}</Text>
          </View>
        ))}
      </View>

      <GradientButton
        label={sessionRunning ? 'Nastavi trening u toku' : 'Započni trening'}
        onPress={onStart}
        style={styles.primaryBtn}
      />

      <Pressable onPress={onCustomize} style={styles.secondaryBtn} accessibilityRole="button">
        <Icon name={workout.builtIn ? 'content_copy' : 'edit'} size={16} color={theme.text} />
        <Text style={styles.secondaryText}>Izmeni trening</Text>
      </Pressable>

      {workout.builtIn ? (
        <Text style={styles.hint}>Napravićemo tvoju kopiju u kojoj možeš da menjaš vežbe, serije i ponavljanja.</Text>
      ) : (
        <>
          <Pressable
            onPress={() => (confirmingDelete ? onDelete() : setConfirmingDelete(true))}
            style={[styles.deleteBtn, confirmingDelete && styles.deleteBtnArmed]}
            accessibilityRole="button"
          >
            <Icon name="delete_outline" size={18} color="#FF6B6B" />
            <Text style={styles.deleteText}>{confirmingDelete ? 'Dodirni ponovo za brisanje' : 'Obriši trening'}</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    content: { paddingTop: 62, paddingHorizontal: 22, paddingBottom: 32 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.ink(0.12),
      alignItems: 'center',
      justifyContent: 'center',
    },
    tagPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, backgroundColor: 'rgba(143,233,206,0.13)' },
    tagText: { fontFamily: 'Poppins_700Bold', fontSize: 11, color: colors.mint },
    title: { fontFamily: 'Poppins_900Black_Italic', fontSize: 30, lineHeight: 36, color: t.text, letterSpacing: -0.3 },
    statsRow: { flexDirection: 'row', gap: 8, marginTop: 18 },
    statBox: { flex: 1, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 18 },
    statValue: { fontFamily: 'Poppins_900Black_Italic', fontSize: 21, color: '#101012' },
    statLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 9.5, letterSpacing: 1, color: '#101012', opacity: 0.6, marginTop: 4 },
    sectionTitle: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 18, color: t.text, marginTop: 28, marginBottom: 12 },
    card: { borderRadius: 26, backgroundColor: t.surface, borderWidth: 1, borderColor: t.ink(0.07), paddingHorizontal: 16 },
    exRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 13,
      borderTopWidth: 1,
      borderTopColor: t.ink(0.06),
    },
    exRowFirst: { borderTopWidth: 0 },
    exIndex: {
      width: 30,
      height: 30,
      borderRadius: 10,
      backgroundColor: softGradientColors[0],
      alignItems: 'center',
      justifyContent: 'center',
    },
    exIndexText: { fontFamily: 'Poppins_700Bold', fontSize: 12, color: colors.mint },
    exName: { flex: 1, fontFamily: 'Poppins_600SemiBold', fontSize: 13.5, color: t.text },
    exPrescription: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 14, color: t.text },
    primaryBtn: { marginTop: 26 },
    secondaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 12,
      height: 48,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: t.ink(0.14),
    },
    secondaryText: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: t.text },
    hint: { fontFamily: 'Poppins_400Regular', fontSize: 11.5, lineHeight: 17, color: t.ink(0.4), textAlign: 'center', marginTop: 12 },
    deleteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 12,
      height: 48,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: 'rgba(255,107,107,0.35)',
    },
    deleteBtnArmed: { backgroundColor: 'rgba(255,107,107,0.12)' },
    deleteText: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: '#FF6B6B' },
  });
