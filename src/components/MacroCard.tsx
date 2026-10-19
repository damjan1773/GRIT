import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GradientTile } from './GradientTile';

interface MacroCardProps {
  label: string;
  current: number;
  goal: number;
  /** Its stretch of the brand gradient, left to right. */
  gradient: [string, string, ...string[]];
  /** The colour it casts beneath it. */
  glow: string;
}

/** A macro eaten so far against its goal, on a raised gradient tile. */
export function MacroCard({ label, current, goal, gradient, glow }: MacroCardProps) {
  const pct = Math.min(100, Math.round((current / goal) * 100));
  return (
    <GradientTile gradient={gradient} glow={glow} contentStyle={styles.content}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>
        {Math.round(current)}
        <Text style={styles.goal}>/{goal}g</Text>
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
    </GradientTile>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 12, paddingTop: 13, paddingBottom: 14 },
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
