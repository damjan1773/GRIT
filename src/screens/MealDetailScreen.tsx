import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { Theme, whiteChipEdge } from '../theme/theme';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { DetailHeader } from '../components/DetailHeader';
import { Icon } from '../components/Icon';
import { useAppData } from '../context/AppDataContext';
import { formatAmount, itemTotals } from '../services/mealParser.types';
import { Meal } from '../types';
import { dayLabel } from '../utils/dates';

/** How long the "tap again to delete" prompt stays armed. */
const CONFIRM_WINDOW_MS = 4000;

/** "Piletina + pirinač" — names come from the chat in lower case. */
function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

interface MealDetailScreenProps {
  meal: Meal;
  onBack: () => void;
}

export function MealDetailScreen({ meal, onBack }: MealDetailScreenProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { profile, todayKey, deleteMeal } = useAppData();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!confirmingDelete) return;
    const timer = setTimeout(() => setConfirmingDelete(false), CONFIRM_WINDOW_MS);
    return () => clearTimeout(timer);
  }, [confirmingDelete]);

  async function remove() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    await deleteMeal(meal.id);
    onBack();
  }

  const time = new Date(meal.timestamp).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' });
  const target = profile?.targetCalories ?? 0;
  const share = target > 0 ? Math.round((meal.calories / target) * 100) : null;
  const goals = profile?.macroGoals;
  const macros = [
    { label: 'Proteini', value: meal.protein, goal: goals?.protein, bg: colors.mint },
    { label: 'Ugljeni h.', value: meal.carbs, goal: goals?.carbs, bg: colors.lav },
    { label: 'Masti', value: meal.fats, goal: goals?.fats, bg: colors.white },
  ];
  const items = meal.items ?? [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <DetailHeader
        title={capitalize(meal.name)}
        subtitle={`${dayLabel(meal.dateKey, todayKey)} · ${time}`}
        onBack={onBack}
        right={
          <Pressable
            onPress={remove}
            style={[styles.deleteBtn, confirmingDelete && styles.deleteBtnArmed]}
            accessibilityRole="button"
            accessibilityLabel={confirmingDelete ? 'Potvrdi brisanje obroka' : 'Obriši obrok'}
          >
            <Icon name="delete_outline" size={19} color={confirmingDelete ? '#101012' : '#FF6B6B'} />
            {/* Spelled out once armed, so the second tap is a decision rather than a slip. */}
            {confirmingDelete && <Text style={styles.deleteText}>Obriši?</Text>}
          </Pressable>
        }
      />

      <View style={styles.kcalCard}>
        <Text style={styles.kcalValue}>
          {Math.round(meal.calories).toLocaleString('sr-RS')}
          <Text style={styles.kcalUnit}> kcal</Text>
        </Text>
        {share !== null && <Text style={styles.kcalShare}>{share}% dnevnog cilja</Text>}

        <View style={styles.macroRow}>
          {macros.map(m => (
            <View
              key={m.label}
              style={[styles.macroBox, { backgroundColor: m.bg }, m.bg === colors.white && whiteChipEdge(theme)]}
            >
              <Text style={styles.macroValue}>{Math.round(m.value)}g</Text>
              <Text style={styles.macroLabel}>{m.label}</Text>
              {m.goal ? <Text style={styles.macroShare}>{Math.round((m.value / m.goal) * 100)}% cilja</Text> : null}
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Namirnice</Text>
      {items.length === 0 ? (
        <Text style={styles.empty}>
          Ovaj obrok je unet pre nego što je aplikacija počela da pamti pojedinačne namirnice, pa su sačuvani samo
          zbirovi.
        </Text>
      ) : (
        <View style={styles.table}>
          {items.map((item, i) => {
            const totals = itemTotals(item);
            return (
              <View key={`${item.name}-${i}`} style={[styles.row, i === 0 && styles.rowFirst]}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {capitalize(item.name)}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {formatAmount(item)} · {totals.protein}g P · {totals.carbs}g U · {totals.fats}g M
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.itemKcal}>{totals.calories}</Text>
                  <Text style={styles.itemKcalLabel}>KCAL</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    content: { paddingTop: 62, paddingHorizontal: 22, paddingBottom: 32 },
    deleteBtn: {
      height: 40,
      minWidth: 40,
      paddingHorizontal: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(255,107,107,0.5)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    deleteBtnArmed: { backgroundColor: '#FF6B6B', borderColor: '#FF6B6B' },
    deleteText: { fontFamily: 'Poppins_700Bold', fontSize: 12.5, color: '#101012' },
    kcalCard: {
      marginTop: 20,
      padding: 20,
      borderRadius: 28,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.ink(0.07),
      alignItems: 'center',
    },
    kcalValue: { fontFamily: 'Poppins_900Black_Italic', fontSize: 48, color: t.text, letterSpacing: -1 },
    kcalUnit: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: t.ink(0.5), letterSpacing: 0 },
    kcalShare: { fontFamily: 'Poppins_500Medium', fontSize: 12.5, color: t.ink(0.5), marginTop: 2 },
    macroRow: { flexDirection: 'row', gap: 8, marginTop: 18, alignSelf: 'stretch' },
    macroBox: { flex: 1, paddingVertical: 12, borderRadius: 18, alignItems: 'center' },
    macroValue: { fontFamily: 'Poppins_900Black_Italic', fontSize: 18, color: '#101012' },
    macroLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 10, color: '#101012', opacity: 0.68, marginTop: 3 },
    macroShare: { fontFamily: 'Poppins_500Medium', fontSize: 9.5, color: '#101012', opacity: 0.55, marginTop: 1 },
    sectionTitle: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 18, color: t.text, marginTop: 26, marginBottom: 10 },
    empty: { fontFamily: 'Poppins_400Regular', fontSize: 12.5, lineHeight: 19, color: t.ink(0.45) },
    table: { borderRadius: 22, backgroundColor: t.surface, borderWidth: 1, borderColor: t.ink(0.07), paddingHorizontal: 16 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: t.ink(0.06) },
    rowFirst: { borderTopWidth: 0 },
    itemName: { fontFamily: 'Poppins_600SemiBold', fontSize: 13.5, color: t.text },
    itemMeta: { fontFamily: 'Poppins_400Regular', fontSize: 11.5, color: t.ink(0.45), marginTop: 2 },
    itemKcal: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 15, color: t.text },
    itemKcalLabel: { fontFamily: 'Poppins_500Medium', fontSize: 9.5, letterSpacing: 1, color: t.ink(0.32) },
  });
