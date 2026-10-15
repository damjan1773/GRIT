import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradientColors, gradientLocations } from '../theme/colors';

/**
 * An exercise's place in a list, on a square of the app gradient. The dark
 * number on the gradient reads the same in both themes, like the avatar.
 */
export function NumberBadge({ value, size = 30 }: { value: number; size?: number }) {
  return (
    <LinearGradient
      colors={gradientColors}
      locations={gradientLocations}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.badge, { width: size, height: size, borderRadius: Math.round(size / 3) }]}
    >
      <Text style={[styles.text, { fontSize: Math.round(size * 0.42) }]}>{value}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: 'Poppins_800ExtraBold_Italic', color: '#101012' },
});
