import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MacroCardProps {
  label: string;
  current: number;
  goal: number;
  bg: string;
}

export function MacroCard({ label, current, goal, bg }: MacroCardProps) {
  const pct = Math.min(100, Math.round((current / goal) * 100));
  return (
    <View style={[styles.card, { backgroundColor: bg }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>
        {Math.round(current)}
        <Text style={styles.goal}>/{goal}g</Text>
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingTop: 13,
    paddingBottom: 14,
  },
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
