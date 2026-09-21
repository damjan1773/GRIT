import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { chartColors } from '../theme/colors';
import { Theme } from '../theme/theme';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { Icon } from '../components/Icon';
import { Sparkline } from '../components/charts/Sparkline';
import { useAppData } from '../context/AppDataContext';
import { METRICS, MetricDef, MetricId, MetricSection, SECTION_TITLES, dailyValues, sectionColor } from '../data/statMetrics';
import { dayLabel } from '../utils/dates';
import { formatSigned, formatSignedAmount } from '../utils/format';
import { exerciseCountLabel } from '../utils/workouts';
import {
  DayValue,
  ExerciseHistory,
  Period,
  PeriodSummary,
  exerciseHistories,
  formatNumber,
  periodDayKeys,
  progressChange,
  progressValue,
  summarize,
} from '../utils/stats';
import { MetricDetailScreen } from './MetricDetailScreen';
import { ExerciseProgressScreen, StrengthListScreen } from './StrengthScreen';
import { WeightScreen, weightsInRange } from './WeightScreen';

type StatsView =
  | { kind: 'list' }
  | { kind: 'metric'; id: MetricId }
  | { kind: 'strength' }
  | { kind: 'exercise'; key: string }
  | { kind: 'weight' };

export function StatsScreen() {
  const navigation = useNavigation<any>();
  const [view, setView] = useState<StatsView>({ kind: 'list' });
  // One range for every detail view, so moving between metrics keeps the same slice.
  const [period, setPeriod] = useState<Period>('week');

  // Tapping the tab while already on it goes back to the list, as native tab bars do.
  useEffect(
    () =>
      navigation.addListener('tabPress', () => {
        if (navigation.isFocused()) setView({ kind: 'list' });
      }),
    [navigation]
  );

  if (view.kind === 'metric') {
    return (
      <MetricDetailScreen
        metricId={view.id}
        period={period}
        onPeriodChange={setPeriod}
        onBack={() => setView({ kind: 'list' })}
      />
    );
  }
  if (view.kind === 'strength') {
    return (
      <StrengthListScreen onBack={() => setView({ kind: 'list' })} onOpen={key => setView({ kind: 'exercise', key })} />
    );
  }
  if (view.kind === 'exercise') {
    return <ExerciseProgressScreen exerciseKey={view.key} onBack={() => setView({ kind: 'strength' })} />;
  }
  if (view.kind === 'weight') {
    return <WeightScreen onBack={() => setView({ kind: 'list' })} />;
  }
  return (
    <StatsList
      onOpenMetric={id => setView({ kind: 'metric', id })}
      onOpenStrength={() => setView({ kind: 'strength' })}
      onOpenWeight={() => setView({ kind: 'weight' })}
    />
  );
}

interface StatsListProps {
  onOpenMetric: (id: MetricId) => void;
  onOpenStrength: () => void;
  onOpenWeight: () => void;
}

function StatsList({ onOpenMetric, onOpenStrength, onOpenWeight }: StatsListProps) {
  const styles = useThemedStyles(makeStyles);
  const { meals, sessions, todayKey } = useAppData();
  const week = useMemo(() => periodDayKeys(todayKey, 'week'), [todayKey]);
  const histories = useMemo(() => exerciseHistories(sessions), [sessions]);

  const cards = METRICS.map(metric => {
    const days = dailyValues(metric, { meals, sessions }, week);
    return { metric, days, summary: summarize(days) };
  });

  // The lift that has moved most — the story the card leads with.
  const featured = [...histories].sort((a, b) => progressChange(b) - progressChange(a))[0];

  const sections: MetricSection[] = ['nutrition', 'training'];
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Statistika</Text>

      <Text style={styles.sectionTitle}>Težina</Text>
      <WeightCard onPress={onOpenWeight} />

      {sections.map(section => (
        <View key={section}>
          <Text style={styles.sectionTitle}>{SECTION_TITLES[section]}</Text>
          <View style={styles.list}>
            {cards
              .filter(card => card.metric.section === section)
              .map(card => (
                <MetricCard key={card.metric.id} {...card} onPress={() => onOpenMetric(card.metric.id)} />
              ))}
            {section === 'training' && (
              <StrengthCard featured={featured} tracked={histories.length} onPress={onOpenStrength} />
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

interface MetricCardProps {
  metric: MetricDef;
  days: DayValue[];
  summary: PeriodSummary;
  onPress: () => void;
}

function MetricCard({ metric, days, summary, onPress }: MetricCardProps) {
  const styles = useThemedStyles(makeStyles);
  const hasData = summary.daysWithData > 0;
  const value = metric.headline === 'average' ? summary.average : summary.total;
  const caption = !hasData
    ? metric.section === 'nutrition'
      ? 'još nema unosa'
      : 'još nema treninga'
    : metric.headline === 'average'
      ? `prosek po danu · ${summary.daysWithData}/7 dana`
      : 'ukupno za 7 dana';
  const valueText = hasData ? formatNumber(value) : '—';

  return (
    <CardShell
      icon={metric.icon}
      color={sectionColor(metric.section)}
      title={metric.title}
      meta="7 dana"
      onPress={onPress}
      accessibilityLabel={`${metric.title}: ${valueText} ${metric.unit}, ${caption}`}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.cardValue}>
          {valueText}
          {hasData && metric.unit ? <Text style={styles.cardUnit}> {metric.unit}</Text> : null}
        </Text>
        <Text style={styles.cardCaption}>{caption}</Text>
      </View>
      <Sparkline values={days.map(d => d.value)} color={sectionColor(metric.section)} />
    </CardShell>
  );
}

interface StrengthCardProps {
  featured: ExerciseHistory | undefined;
  tracked: number;
  onPress: () => void;
}

function StrengthCard({ featured, tracked, onPress }: StrengthCardProps) {
  const styles = useThemedStyles(makeStyles);
  const unit = featured?.bodyweight ? 'pon.' : 'kg';
  const latest = featured ? featured.points[featured.points.length - 1] : undefined;

  let valueText = '—';
  let caption = 'završi trening da vidiš napredak';
  if (featured && latest) {
    const moved = featured.points.length > 1;
    valueText = moved ? formatSignedAmount(progressChange(featured)) : formatNumber(progressValue(featured, latest), 1);
    caption = `${featured.name} · ${moved ? 'od prvog treninga' : featured.bodyweight ? 'ponavljanja' : 'procenjeni 1RM'}`;
  }

  return (
    <CardShell
      icon="trending_up"
      color={chartColors.training}
      title="Napredak snage"
      meta={tracked ? exerciseCountLabel(tracked) : ''}
      onPress={onPress}
      accessibilityLabel={`Napredak snage: ${valueText} ${unit}, ${caption}`}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.cardValue}>
          {valueText}
          {featured ? <Text style={styles.cardUnit}> {unit}</Text> : null}
        </Text>
        <Text style={styles.cardCaption} numberOfLines={1}>
          {caption}
        </Text>
      </View>
      {featured && featured.points.length > 1 ? (
        <Sparkline
          values={featured.points.slice(-7).map(p => progressValue(featured, p))}
          color={chartColors.training}
        />
      ) : null}
    </CardShell>
  );
}

function WeightCard({ onPress }: { onPress: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const { weights, todayKey } = useAppData();
  const latest = weights[weights.length - 1];
  const loggedToday = latest?.dateKey === todayKey;
  const week = weightsInRange(weights, todayKey, 'week');
  const change = week.length > 1 ? week[week.length - 1].kg - week[0].kg : null;

  const valueText = latest ? formatNumber(latest.kg, 1) : '—';
  const caption = !latest
    ? 'dodirni da uneseš prvu težinu'
    : change !== null
      ? `${formatSigned(change, 1)} kg za 7 dana`
      : loggedToday
        ? 'uneto danas'
        : 'dodirni da uneseš današnju';

  return (
    <CardShell
      icon="monitor_weight"
      color={chartColors.nutrition}
      title="Telesna težina"
      meta={latest ? (loggedToday ? 'Danas' : dayLabel(latest.dateKey, todayKey)) : ''}
      onPress={onPress}
      accessibilityLabel={`Telesna težina: ${valueText} kg, ${caption}`}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.cardValue}>
          {valueText}
          {latest ? <Text style={styles.cardUnit}> kg</Text> : null}
        </Text>
        <Text style={styles.cardCaption}>{caption}</Text>
      </View>
      {weights.length > 1 ? (
        <Sparkline values={weights.slice(-7).map(w => w.kg)} color={chartColors.nutrition} relative />
      ) : null}
    </CardShell>
  );
}

interface CardShellProps {
  icon: string;
  color: string;
  title: string;
  meta: string;
  onPress: () => void;
  accessibilityLabel: string;
  children: React.ReactNode;
}

/**
 * A summary card: an icon in the section colour carries identity, while the
 * title and numbers stay in text colours so they read in both themes.
 */
function CardShell({ icon, color, title, meta, onPress, accessibilityLabel, children }: CardShellProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconBadge, { backgroundColor: `${color}24` }]}>
          <Icon name={icon} size={15} color={color} />
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {title}
        </Text>
        {meta ? <Text style={styles.cardMeta}>{meta}</Text> : null}
        <Icon name="chevron_right" size={18} color={theme.ink(0.3)} />
      </View>
      <View style={styles.cardBody}>{children}</View>
    </Pressable>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    content: { paddingTop: 62, paddingHorizontal: 22, paddingBottom: 32 },
    title: { fontFamily: 'Poppins_900Black_Italic', fontSize: 30, color: t.text, letterSpacing: -0.3 },
    sectionTitle: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 18, color: t.text, marginTop: 24, marginBottom: 12 },
    list: { gap: 10 },
    card: {
      padding: 16,
      borderRadius: 24,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.ink(0.07),
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    iconBadge: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    cardTitle: { flex: 1, fontFamily: 'Poppins_700Bold', fontSize: 13.5, color: t.text },
    cardMeta: { fontFamily: 'Poppins_500Medium', fontSize: 11.5, color: t.ink(0.45) },
    cardBody: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: 14 },
    cardValue: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 26, color: t.text },
    cardUnit: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: t.ink(0.5) },
    cardCaption: { fontFamily: 'Poppins_400Regular', fontSize: 11.5, color: t.ink(0.45), marginTop: 1 },
  });
