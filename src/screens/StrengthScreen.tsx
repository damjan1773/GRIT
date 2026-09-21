import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { chartColors } from '../theme/colors';
import { Theme } from '../theme/theme';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { Icon } from '../components/Icon';
import { DetailHeader } from '../components/DetailHeader';
import { LineChart, LinePoint } from '../components/charts/LineChart';
import { StatTile } from '../components/StatTile';
import { useAppData } from '../context/AppDataContext';
import { dayLabel, shortDate } from '../utils/dates';
import { formatSignedAmount, pluralSr } from '../utils/format';
import {
  ExerciseHistory,
  ExercisePoint,
  exerciseHistories,
  formatNumber,
  progressChange,
  progressValue,
} from '../utils/stats';

function unitFor(history: ExerciseHistory): string {
  return history.bodyweight ? 'pon.' : 'kg';
}

function bestSetText(point: ExercisePoint): string {
  return point.bestWeightKg > 0
    ? `${formatNumber(point.bestWeightKg, 1)} kg × ${point.bestReps}`
    : `× ${point.maxReps}`;
}

export function StrengthListScreen({ onBack, onOpen }: { onBack: () => void; onOpen: (key: string) => void }) {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { sessions, todayKey } = useAppData();
  const histories = useMemo(() => exerciseHistories(sessions), [sessions]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <DetailHeader
        title="Napredak snage"
        subtitle="Procenjeni maksimum za jedno ponavljanje (1RM), iz završenih treninga."
        onBack={onBack}
      />

      {histories.length === 0 ? (
        <Text style={[styles.empty, styles.gapTop]}>
          Još nema završenih treninga. Kad završiš prvi, ovde vidiš kako napreduješ na svakoj vežbi.
        </Text>
      ) : (
        <View style={[styles.list, styles.gapTop]}>
          {histories.map(history => {
            const latest = history.points[history.points.length - 1];
            const change = progressChange(history);
            return (
              <Pressable
                key={history.key}
                onPress={() => onOpen(history.key)}
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
                accessibilityRole="button"
              >
                <View style={styles.cardIcon}>
                  <Icon name={history.bodyweight ? 'accessibility_new' : 'fitness_center'} size={19} color={chartColors.training} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {history.name}
                  </Text>
                  <Text style={styles.cardMeta} numberOfLines={1}>
                    {history.points.length} {history.points.length === 1 ? 'trening' : 'treninga'} · {dayLabel(latest.dateKey, todayKey)}
                  </Text>
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.cardValue}>
                    {formatNumber(progressValue(history, latest), 1)}
                    <Text style={styles.cardUnit}> {unitFor(history)}</Text>
                  </Text>
                  {history.points.length > 1 && (
                    <Text style={styles.cardChange}>
                      {formatSignedAmount(change)} {unitFor(history)}
                    </Text>
                  )}
                </View>
                <Icon name="chevron_right" size={20} color={theme.ink(0.3)} />
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

export function ExerciseProgressScreen({ exerciseKey, onBack }: { exerciseKey: string; onBack: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const { sessions, todayKey } = useAppData();
  const history = useMemo(() => exerciseHistories(sessions).find(h => h.key === exerciseKey), [sessions, exerciseKey]);
  const [selected, setSelected] = useState<number | null>(null);

  if (!history) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <DetailHeader title="Vežba" onBack={onBack} />
        <Text style={[styles.empty, styles.gapTop]}>Za ovu vežbu nema završenih serija.</Text>
      </ScrollView>
    );
  }

  const unit = unitFor(history);
  const measure = history.bodyweight ? 'najviše ponavljanja u seriji' : 'procenjeni 1RM';
  const points = history.points;
  const index = selected ?? points.length - 1;
  const picked = points[index];
  const values = points.map(p => progressValue(history, p));
  const best = Math.max(...values);
  const change = progressChange(history);

  const data: LinePoint[] = points.map((point, i) => ({
    key: point.sessionId,
    value: values[i],
    label: shortDate(point.dateKey),
    description: `${dayLabel(point.dateKey, todayKey)}: ${formatNumber(values[i], 1)} ${unit}, najbolja serija ${bestSetText(point)}`,
  }));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <DetailHeader title={history.name} onBack={onBack} />

      <Text style={styles.hero}>
        {formatNumber(values[values.length - 1], 1)}
        <Text style={styles.heroUnit}> {unit}</Text>
      </Text>
      <Text style={styles.heroCaption}>
        {measure} · poslednji trening
        {points.length > 1 ? ` · ${formatSignedAmount(change)} ${unit} od prvog` : ''}
      </Text>

      <View style={styles.chartCard}>
        <View style={styles.readout}>
          <Text style={styles.readoutValue}>
            {formatNumber(values[index], 1)} {unit}
          </Text>
          <Text style={styles.readoutLabel}>
            {dayLabel(picked.dateKey, todayKey)} · najbolja serija {bestSetText(picked)}
          </Text>
        </View>
        {points.length > 1 ? (
          <LineChart
            data={data}
            color={chartColors.training}
            selectedIndex={index}
            onSelect={setSelected}
            formatTick={value => formatNumber(value, history.bodyweight ? 0 : 1)}
          />
        ) : (
          <Text style={styles.empty}>Linija napretka se pojavljuje posle drugog treninga sa ovom vežbom.</Text>
        )}
      </View>

      <View style={styles.tiles}>
        <StatTile label="Najbolje" value={formatNumber(best, 1)} unit={unit} caption={measure} />
        <StatTile
          label={history.bodyweight ? 'Najviše pon.' : 'Najteža serija'}
          value={
            history.bodyweight
              ? String(Math.max(...points.map(p => p.maxReps)))
              : formatNumber(Math.max(...points.map(p => p.bestWeightKg)), 1)
          }
          unit={history.bodyweight ? undefined : 'kg'}
        />
        <StatTile label="Treninga" value={String(points.length)} caption="ukupno" />
      </View>

      <Text style={styles.sectionTitle}>Po treninzima</Text>
      <View style={styles.table}>
        {[...points].reverse().map((point, i) => (
          <View key={point.sessionId} style={[styles.row, i === 0 && styles.rowFirst]}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.rowDate}>{dayLabel(point.dateKey, todayKey)}</Text>
              <Text style={styles.rowMeta}>
                {point.sets} {pluralSr(point.sets, 'serija', 'serije', 'serija')} · najbolja {bestSetText(point)}
              </Text>
            </View>
            <Text style={styles.rowValue}>
              {formatNumber(progressValue(history, point), 1)} {unit}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    content: { paddingTop: 62, paddingHorizontal: 22, paddingBottom: 32 },
    gapTop: { marginTop: 20 },
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
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: 'rgba(123,105,198,0.14)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardName: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: t.text },
    cardMeta: { fontFamily: 'Poppins_400Regular', fontSize: 11.5, color: t.ink(0.45), marginTop: 2 },
    cardRight: { alignItems: 'flex-end' },
    cardValue: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 15, color: t.text },
    cardUnit: { fontFamily: 'Poppins_500Medium', fontSize: 10.5, color: t.ink(0.5) },
    cardChange: { fontFamily: 'Poppins_600SemiBold', fontSize: 11, color: t.ink(0.55), marginTop: 1 },
    hero: { fontFamily: 'Poppins_900Black_Italic', fontSize: 48, color: t.text, marginTop: 18, letterSpacing: -1 },
    heroUnit: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: t.ink(0.5), letterSpacing: 0 },
    heroCaption: { fontFamily: 'Poppins_500Medium', fontSize: 12.5, color: t.ink(0.5) },
    chartCard: {
      marginTop: 18,
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
    tiles: { flexDirection: 'row', gap: 8, marginTop: 12 },
    sectionTitle: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 18, color: t.text, marginTop: 26, marginBottom: 10 },
    table: { borderRadius: 22, backgroundColor: t.surface, borderWidth: 1, borderColor: t.ink(0.07), paddingHorizontal: 16 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderTopWidth: 1, borderTopColor: t.ink(0.06) },
    rowFirst: { borderTopWidth: 0 },
    rowDate: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: t.text },
    rowMeta: { fontFamily: 'Poppins_400Regular', fontSize: 11.5, color: t.ink(0.45), marginTop: 2 },
    rowValue: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 14, color: t.text },
  });
