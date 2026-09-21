import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradientColors, gradientLocations, softGradientColors } from '../theme/colors';
import { Theme } from '../theme/theme';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { Icon } from '../components/Icon';
import { useAppData } from '../context/AppDataContext';
import { BUILT_IN_WORKOUTS } from '../data/builtInWorkouts';
import { Workout, WorkoutSession } from '../types';
import { estimateMinutes, exerciseCountLabel, formatDuration, workoutIcon } from '../utils/workouts';
import { WorkoutBuilderScreen } from './WorkoutBuilderScreen';
import { WorkoutDetailScreen } from './WorkoutDetailScreen';
import { WorkoutSessionScreen } from './WorkoutSessionScreen';

type TrainingView =
  | { kind: 'list' }
  | { kind: 'detail'; workoutId: string }
  /** baseId: a saved workout to edit, or a built-in one to copy. */
  | { kind: 'build'; baseId?: string }
  | { kind: 'session' };

export function TrainingScreen() {
  const navigation = useNavigation<any>();
  const { workouts, saveWorkout, deleteWorkout, activeSession, startSession } = useAppData();
  const [view, setView] = useState<TrainingView>({ kind: 'list' });

  // Tapping the tab while already on it goes back to the list, as native tab bars do.
  useEffect(
    () =>
      navigation.addListener('tabPress', () => {
        if (navigation.isFocused()) setView({ kind: 'list' });
      }),
    [navigation]
  );

  // A running workout takes the whole screen; its own footer is the way out.
  const sessionVisible = view.kind === 'session' && !!activeSession;
  useEffect(() => {
    navigation.setOptions({ tabBarStyle: sessionVisible ? { display: 'none' } : undefined });
  }, [navigation, sessionVisible]);

  const findWorkout = (id?: string): Workout | undefined =>
    id ? [...workouts, ...BUILT_IN_WORKOUTS].find(w => w.id === id) : undefined;

  /** One workout at a time: with a session running, start resumes it instead. */
  async function start(workout: Workout) {
    if (!activeSession) await startSession(workout);
    setView({ kind: 'session' });
  }

  if (view.kind === 'session' && activeSession) {
    return <WorkoutSessionScreen session={activeSession} onMinimize={() => setView({ kind: 'list' })} />;
  }

  if (view.kind === 'build') {
    const base = findWorkout(view.baseId);
    return (
      <WorkoutBuilderScreen
        base={base}
        onCancel={() => setView(base ? { kind: 'detail', workoutId: base.id } : { kind: 'list' })}
        onSave={async workout => {
          await saveWorkout(workout);
          setView({ kind: 'detail', workoutId: workout.id });
        }}
      />
    );
  }

  if (view.kind === 'detail') {
    const workout = findWorkout(view.workoutId);
    if (workout) {
      return (
        <WorkoutDetailScreen
          workout={workout}
          onBack={() => setView({ kind: 'list' })}
          onCustomize={() => setView({ kind: 'build', baseId: workout.id })}
          onStart={() => start(workout)}
          sessionRunning={!!activeSession}
          onDelete={async () => {
            await deleteWorkout(workout.id);
            setView({ kind: 'list' });
          }}
        />
      );
    }
  }

  return (
    <WorkoutList
      workouts={workouts}
      activeSession={activeSession}
      onResume={() => setView({ kind: 'session' })}
      onOpen={id => setView({ kind: 'detail', workoutId: id })}
      onCreate={() => setView({ kind: 'build' })}
    />
  );
}

interface WorkoutListProps {
  workouts: Workout[];
  activeSession: WorkoutSession | null;
  onResume: () => void;
  onOpen: (id: string) => void;
  onCreate: () => void;
}

function WorkoutList({ workouts, activeSession, onResume, onOpen, onCreate }: WorkoutListProps) {
  const styles = useThemedStyles(makeStyles);
  const [now, setNow] = useState(Date.now());

  // Keeps the banner's clock moving while the list is open.
  useEffect(() => {
    if (!activeSession) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [activeSession]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Trening</Text>

      {activeSession && (
        <Pressable onPress={onResume} style={styles.resumeCard} accessibilityRole="button">
          <View style={styles.resumeDot} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.resumeTitle} numberOfLines={1}>
              {activeSession.workoutName}
            </Text>
            <Text style={styles.resumeSub}>trening u toku — nastavi</Text>
          </View>
          <Text style={styles.resumeTime}>{formatDuration(now - activeSession.startedAt)}</Text>
        </Pressable>
      )}

      <Pressable onPress={onCreate} accessibilityRole="button" style={({ pressed }) => pressed && { opacity: 0.9 }}>
        <LinearGradient
          colors={gradientColors}
          locations={gradientLocations}
          start={{ x: 0, y: 0.2 }}
          end={{ x: 1, y: 0.8 }}
          style={styles.createCard}
        >
          <View style={styles.createGlow} />
          <View style={{ flex: 1 }}>
            <Text style={styles.createKicker}>NOVO</Text>
            <Text style={styles.createTitle}>Napravi svoj trening</Text>
            <Text style={styles.createSub}>Izaberi vežbe, serije i ponavljanja.</Text>
          </View>
          <View style={styles.createBtn}>
            <Icon name="add" size={28} color="#fff" />
          </View>
        </LinearGradient>
      </Pressable>

      <Text style={styles.sectionTitle}>Moji treninzi</Text>
      {workouts.length === 0 ? (
        <Text style={styles.empty}>Još nemaš svojih treninga. Napravi novi ili prilagodi neki od gotovih.</Text>
      ) : (
        <View style={styles.list}>
          {workouts.map(w => (
            <WorkoutCard key={w.id} workout={w} onPress={() => onOpen(w.id)} />
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Gotovi treninzi</Text>
      <View style={styles.list}>
        {BUILT_IN_WORKOUTS.map(w => (
          <WorkoutCard key={w.id} workout={w} onPress={() => onOpen(w.id)} />
        ))}
      </View>
    </ScrollView>
  );
}

function WorkoutCard({ workout, onPress }: { workout: Workout; onPress: () => void }) {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      <View style={styles.cardIcon}>
        <Icon name={workoutIcon(workout)} size={20} color={theme.accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.cardName} numberOfLines={1}>
          {workout.name}
        </Text>
        <Text style={styles.cardMeta}>
          {exerciseCountLabel(workout.exercises.length)} · ~{estimateMinutes(workout)} min
        </Text>
      </View>
      {workout.builtIn && (
        <View style={styles.tagPill}>
          <Text style={styles.tagText}>{workout.tag}</Text>
        </View>
      )}
      <Icon name="chevron_right" size={22} color={theme.ink(0.35)} />
    </Pressable>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    content: { paddingTop: 62, paddingHorizontal: 22, paddingBottom: 32 },
    title: { fontFamily: 'Poppins_900Black_Italic', fontSize: 30, color: t.text, letterSpacing: -0.3, marginBottom: 18 },
    createCard: { borderRadius: 30, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14, overflow: 'hidden' },
    createGlow: {
      position: 'absolute',
      right: -40,
      bottom: -56,
      width: 170,
      height: 170,
      borderRadius: 85,
      backgroundColor: 'rgba(255,255,255,0.26)',
    },
    createKicker: { fontFamily: 'Poppins_700Bold', fontSize: 10, letterSpacing: 2, color: '#101012', opacity: 0.6 },
    createTitle: { fontFamily: 'Poppins_900Black_Italic', fontSize: 21, color: '#101012', marginTop: 5 },
    createSub: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#101012', opacity: 0.7, marginTop: 3 },
    createBtn: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#101012', alignItems: 'center', justifyContent: 'center' },
    sectionTitle: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 18, color: t.text, marginTop: 28, marginBottom: 12 },
    empty: { fontFamily: 'Poppins_400Regular', fontSize: 12.5, lineHeight: 19, color: t.ink(0.45) },
    list: { gap: 9 },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.ink(0.06),
    },
    cardIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: softGradientColors[0],
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardName: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: t.text },
    cardMeta: { fontFamily: 'Poppins_400Regular', fontSize: 11.5, color: t.ink(0.45), marginTop: 2 },
    tagPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: 'rgba(143,233,206,0.13)' },
    tagText: { fontFamily: 'Poppins_600SemiBold', fontSize: 10, color: t.accent },
    resumeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 16,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor: 'rgba(143,233,206,0.13)',
      borderWidth: 1,
      borderColor: 'rgba(143,233,206,0.35)',
    },
    resumeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.mint },
    resumeTitle: { fontFamily: 'Poppins_700Bold', fontSize: 13.5, color: t.text },
    resumeSub: { fontFamily: 'Poppins_500Medium', fontSize: 11, color: t.accent, marginTop: 1 },
    resumeTime: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 15, color: t.text },
  });
