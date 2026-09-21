import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../theme/theme';
import { useThemedStyles } from '../theme/ThemeContext';
import { BarChart, BarDatum } from '../components/charts/BarChart';
import { DetailHeader } from '../components/DetailHeader';
import { PeriodToggle } from '../components/PeriodToggle';
import { StatTile } from '../components/StatTile';
import { useAppData } from '../context/AppDataContext';
import { MetricId, SECTION_TITLES, dailyValues, findMetric, sectionColor } from '../data/statMetrics';
import { dayLabel, dayOfMonth, weekdayShort } from '../utils/dates';
import { Period, formatNumber, isOnGoal, periodDayKeys, summarize, trainingByDay } from '../utils/stats';

interface MetricDetailScreenProps {
  metricId: MetricId;
  period: Period;
  onPeriodChange: (period: Period) => void;
  onBack: () => void;
}

/** Axis ticks stay short: 12.500 kg of volume becomes "12,5k". */
function compactTick(value: number): string {
  return value >= 10_000 ? `${formatNumber(value / 1000, 1)}k` : formatNumber(value);
}

export function MetricDetailScreen({ metricId, period, onPeriodChange, onBack }: MetricDetailScreenProps) {
  const styles = useThemedStyles(makeStyles);
  const { meals, sessions, profile, todayKey } = useAppData();
  const metric = findMetric(metricId);
  const color = sectionColor(metric.section);

  const dayKeys = useMemo(() => periodDayKeys(todayKey, period), [todayKey, period]);
  const days = useMemo(() => dailyValues(metric, { meals, sessions }, dayKeys), [metric, meals, sessions, dayKeys]);
  const summary = summarize(days);
  const goal = metric.goal && profile ? metric.goal(profile) : undefined;

  // Opens on today; a new range starts there again.
  const [selected, setSelected] = useState(dayKeys.length - 1);
  useEffect(() => setSelected(dayKeys.length - 1), [dayKeys.length]);
  const picked = days[Math.min(selected, days.length - 1)];

  const withUnit = (value: number) => `${formatNumber(value)}${metric.unit ? ` ${metric.unit}` : ''}`;
  const hero = metric.headline === 'average' ? summary.average : summary.total;
  const heroCaption =
    summary.daysWithData === 0
      ? 'Nema podataka u ovom periodu.'
      : metric.headline === 'average'
        ? `prosek po danu · ${summary.daysWithData} od ${days.length} dana sa unosom`
        : `ukupno · poslednjih ${days.length} dana`;

  const bars: BarDatum[] = days.map(d => ({
    key: d.dateKey,
    value: d.value,
    label: period === 'week' ? weekdayShort(d.dateKey) : String(dayOfMonth(d.dateKey)),
    description: `${dayLabel(d.dateKey, todayKey)}: ${d.hasData ? withUnit(d.value) : 'nema podataka'}`,
  }));

  const tiles = (() => {
    const maxDay = summary.max;
    const maxTile = {
      label: 'Najviše',
      value: maxDay ? formatNumber(maxDay.value) : '—',
      unit: maxDay ? metric.unit : undefined,
      caption: maxDay ? dayLabel(maxDay.dateKey, todayKey) : undefined,
    };
    if (metric.section === 'nutrition') {
      const onGoal = goal ? days.filter(d => d.hasData && isOnGoal(d.value, goal)).length : 0;
      return [
        maxTile,
        { label: 'Dana u cilju', value: `${onGoal}/${summary.daysWithData}`, caption: '±10% od cilja' },
        { label: 'Cilj', value: goal ? formatNumber(goal) : '—', unit: goal ? metric.unit : undefined, caption: 'po danu' },
      ];
    }
    const workouts = trainingByDay(sessions, dayKeys, 'workouts').reduce((sum, d) => sum + d.value, 0);
    if (metric.id === 'workouts') {
      return [
        { label: 'Dana sa treningom', value: String(summary.daysWithData), caption: `od ${days.length}` },
        { label: 'Nedeljno', value: formatNumber((summary.total / days.length) * 7, 1), caption: 'prosek' },
        maxTile,
      ];
    }
    return [
      {
        label: 'Po treningu',
        value: workouts ? formatNumber(summary.total / workouts) : '—',
        unit: workouts ? metric.unit : undefined,
        caption: 'prosek',
      },
      maxTile,
      { label: 'Treninga', value: String(workouts), caption: `za ${days.length} dana` },
    ];
  })();

  const logged = days.filter(d => d.hasData).reverse();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <DetailHeader title={metric.title} tag={SECTION_TITLES[metric.section]} onBack={onBack} />

      <View style={styles.filterRow}>
        <PeriodToggle value={period} onChange={onPeriodChange} />
      </View>

      <Text style={styles.hero}>
        {summary.daysWithData ? formatNumber(hero) : '—'}
        {metric.unit && summary.daysWithData ? <Text style={styles.heroUnit}> {metric.unit}</Text> : null}
      </Text>
      <Text style={styles.heroCaption}>{heroCaption}</Text>

      <View style={styles.chartCard}>
        {/* The readout: value first, the day second. */}
        <View style={styles.readout}>
          <Text style={styles.readoutValue}>{picked.hasData ? withUnit(picked.value) : '—'}</Text>
          <Text style={styles.readoutLabel}>
            {dayLabel(picked.dateKey, todayKey)}
            {goal && picked.hasData ? ` · ${Math.round((picked.value / goal) * 100)}% cilja` : ''}
          </Text>
        </View>
        <BarChart
          data={bars}
          color={color}
          goal={goal}
          selectedIndex={selected}
          onSelect={setSelected}
          labelEvery={period === 'week' ? 1 : 5}
          formatTick={compactTick}
        />
      </View>

      <View style={styles.tiles}>
        {tiles.map(tile => (
          <StatTile key={tile.label} {...tile} />
        ))}
      </View>

      {/* Every value is also here as text — nothing depends on tapping a bar. */}
      <Text style={styles.sectionTitle}>Po danima</Text>
      {logged.length === 0 ? (
        <Text style={styles.empty}>
          {metric.section === 'nutrition' ? 'Nema unetih obroka u ovom periodu.' : 'Nema treninga u ovom periodu.'}
        </Text>
      ) : (
        <View style={styles.table}>
          {logged.map((d, i) => (
            <View key={d.dateKey} style={[styles.row, i === 0 && styles.rowFirst]}>
              <Text style={styles.rowDate}>{dayLabel(d.dateKey, todayKey)}</Text>
              {goal ? <Text style={styles.rowPct}>{Math.round((d.value / goal) * 100)}%</Text> : null}
              <Text style={styles.rowValue}>{withUnit(d.value)}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    content: { paddingTop: 62, paddingHorizontal: 22, paddingBottom: 32 },
    filterRow: { marginTop: 18 },
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
    empty: { fontFamily: 'Poppins_400Regular', fontSize: 12.5, color: t.ink(0.45) },
    table: { borderRadius: 22, backgroundColor: t.surface, borderWidth: 1, borderColor: t.ink(0.07), paddingHorizontal: 16 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderTopWidth: 1, borderTopColor: t.ink(0.06) },
    rowFirst: { borderTopWidth: 0 },
    rowDate: { flex: 1, fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: t.text },
    rowPct: { fontFamily: 'Poppins_500Medium', fontSize: 11.5, color: t.ink(0.45) },
    rowValue: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 14, color: t.text, minWidth: 80, textAlign: 'right' },
  });
