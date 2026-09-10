import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradientColors, gradientLocations, softGradientColors } from '../theme/colors';
import { Icon } from '../components/Icon';
import { ProgressRing } from '../components/ProgressRing';
import { MacroCard } from '../components/MacroCard';
import { useAppData } from '../context/AppDataContext';

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function DashboardScreen() {
  const { profile, todaysMeals } = useAppData();

  if (!profile) {
    return (
      <View style={styles.emptyScreen}>
        <Text style={styles.emptyText}>Prvo popuni onboarding da bismo izračunali tvoj cilj.</Text>
      </View>
    );
  }

  const consumed = todaysMeals.reduce(
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
          <Text style={styles.greeting}>Dobro jutro,</Text>
          <Text style={styles.name}>{profile.name}</Text>
        </View>
        <View style={styles.menuDots}>
          <View style={[styles.dot, { backgroundColor: colors.mint }]} />
          <View style={[styles.dot, { backgroundColor: colors.mid }]} />
          <View style={[styles.dot, { backgroundColor: colors.lav }]} />
        </View>
      </View>

      <View style={styles.ringCard}>
        <View style={styles.ringHeader}>
          <Text style={styles.ringTitle}>Dnevni unos</Text>
          <View style={styles.ringBadge}>
            <Text style={styles.ringBadgeText}>Održavanje · TDEE {profile.tdee.toLocaleString('sr-RS')}</Text>
          </View>
        </View>
        <View style={styles.ringWrap}>
          <ProgressRing progress={pct}>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.consumedValue}>{Math.round(consumed.k).toLocaleString('sr-RS')}</Text>
              <Text style={styles.consumedSub}>od {target.toLocaleString('sr-RS')} kcal</Text>
              <View style={styles.remainingPill}>
                <Icon name="local_fire_department" size={14} color={colors.mint} />
                <Text style={styles.remainingText}>{Math.round(remaining).toLocaleString('sr-RS')} kcal preostalo</Text>
              </View>
            </View>
          </ProgressRing>
        </View>
      </View>

      <View style={styles.macroRow}>
        <MacroCard label="Proteini" current={consumed.p} goal={profile.macroGoals.protein} bg={colors.mint} />
        <MacroCard label="Ugljeni h." current={consumed.c} goal={profile.macroGoals.carbs} bg={colors.lav} />
        <MacroCard label="Masti" current={consumed.f} goal={profile.macroGoals.fats} bg="#fff" />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Poslednji obroci</Text>
      </View>
      <View style={{ gap: 9 }}>
        {todaysMeals.length === 0 && <Text style={styles.emptyMeals}>Još nema unetih obroka danas.</Text>}
        {todaysMeals.map(meal => (
          <View key={meal.id} style={styles.mealRow}>
            <View style={styles.mealIconWrap}>
              <Icon name="restaurant" size={19} color={colors.mint} />
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
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingTop: 62, paddingHorizontal: 22, paddingBottom: 32 },
  emptyScreen: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyText: { fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 15, color: '#101012' },
  greeting: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.48)' },
  name: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 19, color: '#fff', marginTop: 1 },
  menuDots: { gap: 4 },
  dot: { width: 22, height: 3, borderRadius: 2 },
  ringCard: { borderRadius: 32, backgroundColor: '#17171A', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 20, overflow: 'hidden' },
  ringHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  ringTitle: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 16, color: '#fff' },
  ringBadge: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
  ringBadgeText: { fontFamily: 'Poppins_600SemiBold', fontSize: 10.5, color: 'rgba(255,255,255,0.55)' },
  ringWrap: { alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  consumedValue: { fontFamily: 'Poppins_900Black_Italic', fontSize: 50, color: '#fff' },
  consumedSub: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 5 },
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
  remainingText: { fontFamily: 'Poppins_700Bold', fontSize: 11, color: colors.mint },
  macroRow: { flexDirection: 'row', gap: 9, marginTop: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 12 },
  sectionTitle: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 18, color: '#fff' },
  emptyMeals: { fontFamily: 'Poppins_400Regular', fontSize: 12.5, color: 'rgba(255,255,255,0.4)' },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#17171A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  mealIconWrap: { width: 38, height: 38, borderRadius: 13, backgroundColor: softGradientColors[0], alignItems: 'center', justifyContent: 'center' },
  mealName: { fontFamily: 'Poppins_600SemiBold', fontSize: 13.5, color: '#fff' },
  mealMeta: { fontFamily: 'Poppins_400Regular', fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  mealKcal: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 15, color: '#fff' },
  mealKcalLabel: { fontFamily: 'Poppins_500Medium', fontSize: 9.5, letterSpacing: 1, color: 'rgba(255,255,255,0.32)' },
});
