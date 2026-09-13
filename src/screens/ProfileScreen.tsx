import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradientColors, gradientLocations, softGradientColors } from '../theme/colors';
import { Theme, whiteChipEdge } from '../theme/theme';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { Icon } from '../components/Icon';
import { GradientButton } from '../components/GradientButton';
import { bmiLabel, calculateBMI, getActivityOption, goalLabel } from '../utils/calculations';
import { formatSigned } from '../utils/format';
import { UserProfile } from '../types';

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

interface DetailRowProps {
  icon: string;
  label: string;
  value: string;
  note?: string;
  first?: boolean;
}

function DetailRow({ icon, label, value, note, first }: DetailRowProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.row, first && styles.rowFirst]}>
      <View style={styles.rowIcon}>
        <Icon name={icon} size={18} color={colors.mint} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowValueWrap}>
        <Text style={styles.rowValue}>{value}</Text>
        {note ? <Text style={styles.rowNote}>{note}</Text> : null}
      </View>
    </View>
  );
}

/** Switch on for the light theme; dark is the default. */
function ThemeRow() {
  const { theme, setMode } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const isLight = theme.mode === 'light';
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Icon name={isLight ? 'light_mode' : 'dark_mode'} size={18} color={colors.mint} />
      </View>
      <Text style={styles.rowLabel}>Tema</Text>
      <Text style={styles.rowNote}>{isLight ? 'Svetla' : 'Tamna'}</Text>
      <Switch
        value={isLight}
        onValueChange={on => setMode(on ? 'light' : 'dark')}
        trackColor={{ false: theme.ink(0.16), true: colors.mint }}
        thumbColor="#ffffff"
        ios_backgroundColor={theme.ink(0.16)}
        accessibilityLabel="Svetla tema"
      />
    </View>
  );
}

interface ProfileScreenProps {
  profile: UserProfile;
  onEdit: () => void;
}

export function ProfileScreen({ profile, onEdit }: ProfileScreenProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const activity = getActivityOption(profile.activity);
  const bmi = calculateBMI(profile.weightKg, profile.heightCm);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <LinearGradient colors={gradientColors} locations={gradientLocations} style={styles.avatar}>
          <Text style={styles.avatarText}>{initialsOf(profile.name)}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.subtitle}>Tvoj profil</Text>
        </View>
      </View>

      <View style={styles.goalCard}>
        <Text style={styles.goalBadge}>DNEVNI CILJ</Text>
        <Text style={styles.goalValue}>{profile.targetCalories.toLocaleString('sr-RS')}</Text>
        <Text style={styles.goalSub}>kcal na dan · {goalLabel(profile.calorieAdjustment)}</Text>
        <View style={styles.macroRow}>
          <View style={[styles.macroBox, { backgroundColor: colors.mint }]}>
            <Text style={styles.macroValue}>{profile.macroGoals.protein}g</Text>
            <Text style={styles.macroLabel}>Proteini</Text>
          </View>
          <View style={[styles.macroBox, { backgroundColor: colors.lav }]}>
            <Text style={styles.macroValue}>{profile.macroGoals.carbs}g</Text>
            <Text style={styles.macroLabel}>Ugljeni h.</Text>
          </View>
          <View style={[styles.macroBox, { backgroundColor: colors.white }, whiteChipEdge(theme)]}>
            <Text style={styles.macroValue}>{profile.macroGoals.fats}g</Text>
            <Text style={styles.macroLabel}>Masti</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Tvoji podaci</Text>
      <View style={styles.card}>
        <DetailRow first icon="female" label="Pol" value={profile.sex === 'm' ? 'Muško' : 'Žensko'} />
        <DetailRow icon="cake" label="Godine" value={`${profile.age}`} note="godina" />
        <DetailRow icon="monitor_weight" label="Težina" value={`${profile.weightKg}`} note="kg" />
        <DetailRow icon="straighten" label="Visina" value={`${profile.heightCm}`} note="cm" />
        <DetailRow icon="directions_run" label="Aktivnost" value={activity.name} note={`×${activity.multiplier}`} />
        <DetailRow
          icon="flag"
          label="Cilj"
          value={goalLabel(profile.calorieAdjustment)}
          note={profile.calorieAdjustment ? `${formatSigned(profile.calorieAdjustment)} kcal` : undefined}
        />
        <DetailRow icon="monitor_heart" label="BMI" value={bmi.toFixed(1)} note={bmiLabel(bmi)} />
        <DetailRow icon="local_fire_department" label="BMR" value={profile.bmr.toLocaleString('sr-RS')} note="kcal" />
        <DetailRow icon="bolt" label="TDEE" value={profile.tdee.toLocaleString('sr-RS')} note="kcal" />
        <ThemeRow />
      </View>

      <GradientButton label="Izmeni podatke" onPress={onEdit} style={styles.editBtn} />
      <Text style={styles.editHint}>Promena mera ili aktivnosti ponovo računa tvoj dnevni cilj.</Text>
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    content: { paddingTop: 62, paddingHorizontal: 22, paddingBottom: 32 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22 },
    avatar: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 18, color: '#101012' },
    name: { fontFamily: 'Poppins_900Black_Italic', fontSize: 24, color: t.text, letterSpacing: -0.3 },
    subtitle: { fontFamily: 'Poppins_500Medium', fontSize: 12.5, color: t.ink(0.45), marginTop: 2 },
    goalCard: {
      borderRadius: 32,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.ink(0.07),
      padding: 20,
      alignItems: 'center',
    },
    goalBadge: { fontFamily: 'Poppins_600SemiBold', fontSize: 10.5, letterSpacing: 2, color: colors.mint },
    goalValue: { fontFamily: 'Poppins_900Black_Italic', fontSize: 52, color: t.text, marginTop: 8, letterSpacing: -1 },
    goalSub: { fontFamily: 'Poppins_500Medium', fontSize: 12.5, color: t.ink(0.45), marginTop: 2 },
    macroRow: { flexDirection: 'row', gap: 8, marginTop: 20, alignSelf: 'stretch' },
    macroBox: { flex: 1, paddingVertical: 12, borderRadius: 18, alignItems: 'center' },
    macroValue: { fontFamily: 'Poppins_900Black_Italic', fontSize: 18, color: '#101012' },
    macroLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 10, color: '#101012', opacity: 0.68, marginTop: 3 },
    sectionTitle: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 16, color: t.text, marginTop: 26, marginBottom: 11 },
    card: { borderRadius: 26, backgroundColor: t.surface, borderWidth: 1, borderColor: t.ink(0.07), paddingHorizontal: 16 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: t.ink(0.06),
    },
    rowFirst: { borderTopWidth: 0 },
    rowIcon: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: softGradientColors[0],
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowLabel: { flex: 1, fontFamily: 'Poppins_500Medium', fontSize: 13, color: t.ink(0.6) },
    rowValueWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
    rowValue: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 16, color: t.text },
    rowNote: { fontFamily: 'Poppins_500Medium', fontSize: 11.5, color: t.ink(0.4) },
    editBtn: { marginTop: 26 },
    editHint: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 11.5,
      lineHeight: 17,
      color: t.ink(0.35),
      textAlign: 'center',
      marginTop: 12,
    },
  });
