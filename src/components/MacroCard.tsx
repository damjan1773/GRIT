import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

interface MacroCardProps {
  label: string;
  current: number;
  goal: number;
  /** Its stretch of the brand gradient, left to right. */
  gradient: [string, string, ...string[]];
  /** The colour it casts beneath it — its own hue, so it glows rather than greys. */
  glow: string;
}

/**
 * A raised tile: its slice of the gradient, a gloss across the top as if lit
 * from above, a bright rim, and a soft shadow in its own colour underneath.
 */
export function MacroCard({ label, current, goal, gradient, glow }: MacroCardProps) {
  const { theme } = useTheme();
  const pct = Math.min(100, Math.round((current / goal) * 100));
  const dark = theme.mode === 'dark';
  return (
    <View
      style={[
        styles.lift,
        {
          // On the near-black page a black shadow vanishes, so dark casts the tile's
          // own colour; on white a soft grey reads as depth. One boxShadow string
          // draws the same on iOS, Android and the web.
          boxShadow: dark ? `0px 6px 14px ${glow}47` : '0px 6px 14px #1010121C',
        },
      ]}
    >
      <LinearGradient colors={gradient} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.card}>
        <LinearGradient
          colors={['rgba(255,255,255,0.42)', 'rgba(255,255,255,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gloss}
          pointerEvents="none"
        />
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {Math.round(current)}
          <Text style={styles.goal}>/{goal}g</Text>
        </Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct}%` }]} />
        </View>
      </LinearGradient>
    </View>
  );
}

const RADIUS = 22;

const styles = StyleSheet.create({
  lift: { flex: 1, borderRadius: RADIUS },
  card: {
    borderRadius: RADIUS,
    paddingHorizontal: 12,
    paddingTop: 13,
    paddingBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  gloss: { position: 'absolute', left: 0, right: 0, top: 0, height: '55%' },
  label: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10.5,
    color: '#101012',
    opacity: 0.7,
  },
  value: {
    fontFamily: 'Poppins_900Black_Italic',
    fontSize: 21,
    lineHeight: 23,
    color: '#101012',
    marginTop: 4,
  },
  goal: {
    fontFamily: 'Poppins_800ExtraBold_Italic',
    fontSize: 12,
    opacity: 0.6,
  },
  track: {
    height: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(16,16,18,0.18)',
    marginTop: 10,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 99,
    backgroundColor: '#101012',
  },
});
