import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradientColors, gradientLocations, softGradientColors } from '../theme/colors';
import { Theme } from '../theme/theme';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { Icon } from '../components/Icon';
import { ProgressRing } from '../components/ProgressRing';
import { MacroCard } from '../components/MacroCard';
import { SwipeableRow } from '../components/SwipeableRow';
import { DayPicker } from '../components/DayPicker';
import { useAppData } from '../context/AppDataContext';
import { dayLabel, greetingFor } from '../utils/dates';

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function DashboardScreen() {
  const { profile, todayKey, selectedDateKey, setSelectedDateKey, dayMeals, deleteMeal } = useAppData();
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const styles = useThemedStyles(makeStyles);
  const { theme } = useTheme();

  // The tab stays mounted, so check the clock each minute; an unchanged greeting doesn't re-render.
  const [greeting, setGreeting] = useState(() => greetingFor(new Date()));
  useEffect(() => {
    const timer = setInterval(() => setGreeting(greetingFor(new Date())), 60_000);
    return () => clearInterval(timer);
  }, []);

  if (!profile) {
    return (
      <View style={styles.emptyScreen}>
        <Text style={styles.emptyText}>Prvo popuni onboarding da bismo izračunali tvoj cilj.</Text>
      </View>
    );
  }

  const isToday = selectedDateKey === todayKey;
  const consumed = dayMeals.reduce(
    (acc, m) => ({ k: acc.k + m.calories, p: acc.p + m.protein, c: acc.c + m.carbs, f: acc.f + m.fats }),
    { k: 0, p: 0, c: 0, f: 0 }
  );
  const target = profile.targetCalories;
  const remaining = Math.max(0, target - consumed.k);
  const pct = target > 0 ? consumed.k / target : 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <LinearGradient colors={gradientColors} locations={gradientLocations} style={styles.avatar}>
          <Text style={styles.avatarText}>{initialsOf(profile.name)}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.name}>{profile.name}</Text>
        </View>
        <Pressable
          onPress={() => setDayPickerOpen(open => !open)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={dayPickerOpen ? 'Zatvori izbor dana' : 'Izaberi dan'}
          style={styles.menuDots}
        >
          <View style={[styles.dot, { backgroundColor: colors.mint }]} />
          <View style={[styles.dot, { backgroundColor: colors.mid }]} />
          <View style={[styles.dot, { backgroundColor: colors.lav }]} />
        </Pressable>
      </View>

      {dayPickerOpen && (
        <DayPicker todayKey={todayKey} selectedDateKey={selectedDateKey} onSelect={setSelectedDateKey} />
      )}

      <View style={styles.ringCard}>
        <View style={styles.ringHeader}>
          <Text style={styles.ringTitle}>Dnevni unos</Text>
          {!isToday && (
            <View style={styles.dayPill}>
              <Text style={styles.dayPillText}>{dayLabel(selectedDateKey, todayKey)}</Text>
            </View>
          )}
        </View>
        <View style={styles.ringWrap}>
          <ProgressRing progress={pct}>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.consumedValue}>{Math.round(consumed.k).toLocaleString('sr-RS')}</Text>
              <Text style={styles.consumedSub}>od {target.toLocaleString('sr-RS')} kcal</Text>
              <View style={styles.remainingPill}>
                <Icon name="local_fire_department" size={14} color={theme.accent} />
                <Text style={styles.remainingText}>{Math.round(remaining).toLocaleString('sr-RS')} kcal preostalo</Text>
              </View>
            </View>
          </ProgressRing>
        </View>
      </View>

      <View style={styles.macroRow}>
        <MacroCard label="Proteini" current={consumed.p} goal={profile.macroGoals.protein} bg={colors.mint} />
        <MacroCard label="Ugljeni h." current={consumed.c} goal={profile.macroGoals.carbs} bg={colors.lav} />
        <MacroCard label="Masti" current={consumed.f} goal={profile.macroGoals.fats} bg={colors.white} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Poslednji obroci</Text>
      </View>
      <View style={{ gap: 9 }}>
        {dayMeals.length === 0 && (
          <Text style={styles.emptyMeals}>{isToday ? 'Još nema unetih obroka danas.' : 'Nema unetih obroka za ovaj dan.'}</Text>
        )}
        {dayMeals.map(meal => (
          <SwipeableRow key={meal.id} onDelete={() => deleteMeal(meal.id)}>
            <View style={styles.mealRow}>
              <View style={styles.mealIconWrap}>
                <Icon name="restaurant" size={19} color={theme.accent} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.mealName} numberOfLines={1}>
                  {meal.name}
                </Text>
                <Text style={styles.mealMeta}>
                  {new Date(meal.timestamp).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })} · {meal.protein}g P ·{' '}
                  {meal.carbs}g U · {meal.fats}g M
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.mealKcal}>{Math.round(meal.calories)}</Text>
                <Text style={styles.mealKcalLabel}>KCAL</Text>
              </View>
            </View>
          </SwipeableRow>
        ))}
      </View>
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    content: { paddingTop: 62, paddingHorizontal: 22, paddingBottom: 32 },
    emptyScreen: { flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', padding: 30 },
    emptyText: { fontFamily: 'Poppins_400Regular', color: t.ink(0.6), textAlign: 'center' },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
    avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 15, color: '#101012' },
    greeting: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: t.ink(0.48) },
    name: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 19, color: t.text, marginTop: 1 },
    menuDots: { gap: 4 },
    dot: { width: 22, height: 3, borderRadius: 2 },
    ringCard: { borderRadius: 32, backgroundColor: t.surface, borderWidth: 1, borderColor: t.ink(0.07), padding: 20, overflow: 'hidden' },
    ringHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    ringTitle: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 16, color: t.text },
    dayPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: 'rgba(143,233,206,0.13)' },
    dayPillText: { fontFamily: 'Poppins_700Bold', fontSize: 11, color: t.accent },
    ringWrap: { alignItems: 'center', justifyContent: 'center', marginTop: 4 },
    consumedValue: { fontFamily: 'Poppins_900Black_Italic', fontSize: 50, color: t.text },
    consumedSub: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: t.ink(0.45), marginTop: 5 },
    remainingPill: {
      marginTop: 11,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 99,
      backgroundColor: 'rgba(143,233,206,0.13)',
    },
    remainingText: { fontFamily: 'Poppins_700Bold', fontSize: 11, color: t.accent },
    macroRow: { flexDirection: 'row', gap: 9, marginTop: 12 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 12 },
    sectionTitle: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 18, color: t.text },
    emptyMeals: { fontFamily: 'Poppins_400Regular', fontSize: 12.5, color: t.ink(0.4) },
    mealRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.ink(0.06),
    },
    mealIconWrap: { width: 38, height: 38, borderRadius: 13, backgroundColor: softGradientColors[0], alignItems: 'center', justifyContent: 'center' },
    mealName: { fontFamily: 'Poppins_600SemiBold', fontSize: 13.5, color: t.text },
    mealMeta: { fontFamily: 'Poppins_400Regular', fontSize: 11.5, color: t.ink(0.4), marginTop: 2 },
    mealKcal: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 15, color: t.text },
    mealKcalLabel: { fontFamily: 'Poppins_500Medium', fontSize: 9.5, letterSpacing: 1, color: t.ink(0.32) },
  });
