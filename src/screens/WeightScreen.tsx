import React, { useEffect, useMemo, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { chartColors, gradientColors, gradientLocations } from '../theme/colors';
import { Theme } from '../theme/theme';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { Icon } from '../components/Icon';
import { DetailHeader } from '../components/DetailHeader';
import { PeriodToggle, ToggleOption } from '../components/PeriodToggle';
import { LineChart, LinePoint } from '../components/charts/LineChart';
import { StatTile } from '../components/StatTile';
import { useAppData } from '../context/AppDataContext';
import { WeightEntry } from '../types';
import { dayLabel, dayNumber, shiftDateKey, shortDate } from '../utils/dates';
import { formatSigned } from '../utils/format';
import { formatNumber } from '../utils/stats';

export type WeightRange = 'week' | 'month' | 'all';

const RANGE_OPTIONS: ToggleOption<WeightRange>[] = [
  { id: 'week', label: 'Nedelja' },
  { id: 'month', label: 'Mesec' },
  { id: 'all', label: 'Sve' },
];

const MIN_KG = 25;
const MAX_KG = 350;
const STEP_KG = 0.1;

/** Weigh-ins inside the range, oldest first. */
export function weightsInRange(weights: WeightEntry[], todayKey: string, range: WeightRange): WeightEntry[] {
  if (range === 'all') return weights;
  const from = shiftDateKey(todayKey, range === 'week' ? -6 : -29);
  return weights.filter(w => w.dateKey >= from && w.dateKey <= todayKey);
}

/** "82,4" — one decimal, always shown, so the field doesn't jump between 82 and 82,1. */
function kgText(kg: number): string {
  return kg.toLocaleString('sr-RS', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function parseKg(text: string): number | null {
  const value = Number(text.replace(',', '.').trim());
  if (!Number.isFinite(value) || value < MIN_KG || value > MAX_KG) return null;
  return Math.round(value * 10) / 10;
}

export function WeightScreen({ onBack }: { onBack: () => void }) {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { weights, logWeight, deleteWeight, profile, todayKey } = useAppData();
  const [range, setRange] = useState<WeightRange>('month');

  const todayEntry = weights.find(w => w.dateKey === todayKey);
  const latest = weights[weights.length - 1];
  // Starts from the last weigh-in, so a normal day is a tap or two on the stepper.
  const [draft, setDraft] = useState(() => kgText(todayEntry?.kg ?? latest?.kg ?? profile?.weightKg ?? 70));
  const parsed = parseKg(draft);
  const savedAlready = todayEntry !== undefined && parsed === todayEntry.kg;

  const step = (delta: number) => {
    const base = parsed ?? todayEntry?.kg ?? latest?.kg ?? profile?.weightKg ?? 70;
    const next = Math.min(MAX_KG, Math.max(MIN_KG, Math.round((base + delta) * 10) / 10));
    setDraft(kgText(next));
  };

  const save = async () => {
    if (parsed === null || savedAlready) return;
    Keyboard.dismiss();
    await logWeight(parsed);
    setDraft(kgText(parsed));
  };

  const shown = useMemo(() => weightsInRange(weights, todayKey, range), [weights, todayKey, range]);
  const [selected, setSelected] = useState(shown.length - 1);
  useEffect(() => setSelected(shown.length - 1), [shown.length, range]);
  const picked = shown[Math.min(Math.max(selected, 0), shown.length - 1)];

  const first = shown[0];
  const last = shown[shown.length - 1];
  const change = first && last && shown.length > 1 ? last.kg - first.kg : null;
  const rangeText = range === 'week' ? 'za 7 dana' : range === 'month' ? 'za 30 dana' : 'od prvog unosa';

  const points: LinePoint[] = shown.map(w => ({
    key: w.dateKey,
    value: w.kg,
    label: shortDate(w.dateKey),
    description: `${dayLabel(w.dateKey, todayKey)}: ${kgText(w.kg)} kg`,
    at: dayNumber(w.dateKey),
  }));

  // Double tap to delete: the first arms the row, the second removes it.
  const [armed, setArmed] = useState<string | null>(null);
  const history = [...weights].reverse();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <DetailHeader title="Telesna težina" onBack={onBack} />

      <View style={styles.entryCard}>
        <Text style={styles.entryLabel}>{todayEntry ? 'Današnja težina' : 'Unesi današnju težinu'}</Text>
        <View style={styles.entryRow}>
          <Pressable onPress={() => step(-STEP_KG)} style={styles.stepBtn} accessibilityRole="button" accessibilityLabel="Smanji za 0,1 kg">
            <Icon name="remove" size={20} color={theme.text} />
          </Pressable>
          <View style={styles.inputWrap}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={save}
              selectTextOnFocus
              maxLength={5}
              style={styles.input}
              accessibilityLabel="Težina u kilogramima"
            />
            <Text style={styles.inputUnit}>kg</Text>
          </View>
          <Pressable onPress={() => step(STEP_KG)} style={styles.stepBtn} accessibilityRole="button" accessibilityLabel="Povećaj za 0,1 kg">
            <Icon name="add" size={20} color={theme.text} />
          </Pressable>
        </View>
        <Pressable
          onPress={save}
          disabled={parsed === null || savedAlready}
          accessibilityRole="button"
          style={({ pressed }) => [pressed && { opacity: 0.85 }]}
        >
          {parsed === null || savedAlready ? (
            <View style={[styles.saveBtn, styles.saveBtnIdle]}>
              {savedAlready && <Icon name="check" size={16} color={theme.ink(0.55)} />}
              <Text style={styles.saveTextIdle}>{savedAlready ? 'Sačuvano za danas' : `Unesi ${MIN_KG}–${MAX_KG} kg`}</Text>
            </View>
          ) : (
            <LinearGradient colors={gradientColors} locations={gradientLocations} start={{ x: 0, y: 0.3 }} end={{ x: 1, y: 0.7 }} style={styles.saveBtn}>
              <Text style={styles.saveText}>{todayEntry ? 'Izmeni današnji unos' : 'Sačuvaj'}</Text>
            </LinearGradient>
          )}
        </Pressable>
      </View>

      {weights.length === 0 ? (
        <Text style={styles.empty}>Sačuvaj prvu težinu i ovde ćeš pratiti kako se menja iz nedelje u nedelju.</Text>
      ) : (
        <>
          <View style={styles.filterRow}>
            <PeriodToggle value={range} onChange={setRange} options={RANGE_OPTIONS} />
          </View>

          <View style={styles.chartCard}>
            {picked ? (
              <View style={styles.readout}>
                <Text style={styles.readoutValue}>{kgText(picked.kg)} kg</Text>
                <Text style={styles.readoutLabel}>
                  {dayLabel(picked.dateKey, todayKey)}
                  {/* On the latest point the readout also tells the range's story. */}
                  {picked === last && change !== null ? ` · ${formatSigned(change, 1)} kg ${rangeText}` : ''}
                </Text>
              </View>
            ) : null}
            {shown.length > 1 ? (
              <LineChart
                data={points}
                color={chartColors.nutrition}
                selectedIndex={Math.min(Math.max(selected, 0), shown.length - 1)}
                onSelect={setSelected}
                formatTick={value => formatNumber(value, 1)}
                stepUnit={0.5}
              />
            ) : (
              <Text style={styles.chartNote}>
                {shown.length === 0
                  ? 'U ovom periodu nema unosa.'
                  : 'Linija se pojavljuje od drugog unosa u ovom periodu.'}
              </Text>
            )}
          </View>

          {shown.length > 0 && (
            <View style={styles.tiles}>
              <StatTile label="Početak" value={kgText(first.kg)} unit="kg" caption={shortDate(first.dateKey)} />
              <StatTile label="Najniža" value={kgText(Math.min(...shown.map(w => w.kg)))} unit="kg" />
              <StatTile label="Najviša" value={kgText(Math.max(...shown.map(w => w.kg)))} unit="kg" />
            </View>
          )}

          <Text style={styles.sectionTitle}>Unosi</Text>
          <View style={styles.table}>
            {history.map((entry, i) => {
              const previous = history[i + 1];
              const diff = previous ? entry.kg - previous.kg : null;
              const isArmed = armed === entry.dateKey;
              return (
                <View key={entry.dateKey} style={[styles.row, i === 0 && styles.rowFirst]}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.rowDate}>{dayLabel(entry.dateKey, todayKey)}</Text>
                    {diff !== null && <Text style={styles.rowMeta}>{formatSigned(diff, 1)} kg od prethodnog</Text>}
                  </View>
                  <Text style={styles.rowValue}>{kgText(entry.kg)} kg</Text>
                  <Pressable
                    onPress={() => (isArmed ? deleteWeight(entry.dateKey) : setArmed(entry.dateKey))}
                    style={[styles.deleteBtn, isArmed && styles.deleteBtnArmed]}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={isArmed ? 'Potvrdi brisanje' : `Obriši unos, ${dayLabel(entry.dateKey, todayKey)}`}
                  >
                    <Icon name="delete_outline" size={17} color={isArmed ? '#101012' : theme.ink(0.35)} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    content: { paddingTop: 62, paddingHorizontal: 22, paddingBottom: 32 },
    entryCard: {
      marginTop: 18,
      padding: 16,
      borderRadius: 26,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.ink(0.07),
      gap: 14,
    },
    entryLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: t.ink(0.6) },
    entryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    stepBtn: {
      width: 46,
      height: 46,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.ink(0.12),
      alignItems: 'center',
      justifyContent: 'center',
    },
    inputWrap: { flex: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 4 },
    // Right-aligned at a fixed width, so the number and "kg" sit together as one centred group.
    input: {
      fontFamily: 'Poppins_900Black_Italic',
      fontSize: 38,
      color: t.text,
      textAlign: 'right',
      width: 112,
      paddingVertical: 0,
      letterSpacing: -0.5,
    },
    inputUnit: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: t.ink(0.5) },
    saveBtn: {
      height: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    saveBtnIdle: { backgroundColor: t.ink(0.06) },
    saveText: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#101012' },
    saveTextIdle: { fontFamily: 'Poppins_600SemiBold', fontSize: 13.5, color: t.ink(0.55) },
    empty: { fontFamily: 'Poppins_400Regular', fontSize: 12.5, lineHeight: 19, color: t.ink(0.45), marginTop: 18 },
    filterRow: { marginTop: 24 },
    chartCard: {
      marginTop: 12,
      padding: 14,
      paddingTop: 12,
      borderRadius: 26,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.ink(0.07),
    },
    readout: { marginBottom: 10 },
    readoutValue: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 18, color: t.text },
    readoutLabel: { fontFamily: 'Poppins_500Medium', fontSize: 11.5, color: t.ink(0.5), marginTop: 1 },
    chartNote: { fontFamily: 'Poppins_400Regular', fontSize: 12.5, lineHeight: 19, color: t.ink(0.45), paddingVertical: 8 },
    tiles: { flexDirection: 'row', gap: 8, marginTop: 12 },
    sectionTitle: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 18, color: t.text, marginTop: 26, marginBottom: 10 },
    table: { borderRadius: 22, backgroundColor: t.surface, borderWidth: 1, borderColor: t.ink(0.07), paddingHorizontal: 16 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderTopWidth: 1, borderTopColor: t.ink(0.06) },
    rowFirst: { borderTopWidth: 0 },
    rowDate: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: t.text },
    rowMeta: { fontFamily: 'Poppins_400Regular', fontSize: 11.5, color: t.ink(0.45), marginTop: 2 },
    rowValue: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 14, color: t.text },
    deleteBtn: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    deleteBtnArmed: { backgroundColor: '#FF6B6B' },
  });
