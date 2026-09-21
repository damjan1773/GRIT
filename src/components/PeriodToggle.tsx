import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradientColors, gradientLocations } from '../theme/colors';
import { Theme } from '../theme/theme';
import { useThemedStyles } from '../theme/ThemeContext';
import { Period } from '../utils/stats';

export interface ToggleOption<T extends string> {
  id: T;
  label: string;
}

const PERIOD_OPTIONS: ToggleOption<Period>[] = [
  { id: 'week', label: 'Nedelja' },
  { id: 'month', label: 'Mesec' },
];

interface PeriodToggleProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  /** Defaults to week / month. */
  options?: ToggleOption<T>[];
}

/** The date range, in one row above everything it scopes. */
export function PeriodToggle<T extends string = Period>({ value, onChange, options }: PeriodToggleProps<T>) {
  const styles = useThemedStyles(makeStyles);
  const list = options ?? (PERIOD_OPTIONS as unknown as ToggleOption<T>[]);
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {list.map(option => {
        const selected = option.id === value;
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            style={styles.optionWrap}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
          >
            {selected ? (
              <LinearGradient colors={gradientColors} locations={gradientLocations} style={styles.option}>
                <Text style={[styles.label, styles.labelSelected]}>{option.label}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.option}>
                <Text style={styles.label}>{option.label}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    track: {
      flexDirection: 'row',
      padding: 3,
      borderRadius: 99,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.ink(0.07),
    },
    optionWrap: { flex: 1 },
    option: { paddingVertical: 8, borderRadius: 99, alignItems: 'center' },
    label: { fontFamily: 'Poppins_600SemiBold', fontSize: 12.5, color: t.ink(0.6) },
    labelSelected: { color: '#101012' },
  });
