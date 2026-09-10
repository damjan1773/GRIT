import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradientColors, gradientLocations } from '../theme/colors';

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  height?: number;
  disabled?: boolean;
}

export function GradientButton({ label, onPress, style, height = 58, disabled }: GradientButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [{ opacity: disabled ? 0.35 : pressed ? 0.85 : 1 }, style]}
    >
      <LinearGradient
        colors={gradientColors}
        locations={gradientLocations}
        start={{ x: 0, y: 0.2 }}
        end={{ x: 1, y: 0.8 }}
        style={[styles.button, { height, borderRadius: height / 2 }]}
      >
        <Text style={styles.label}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8FE9CE',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 6,
  },
  label: {
    fontFamily: 'Poppins_800ExtraBold_Italic',
    fontSize: 16,
    color: '#0d0d0f',
    letterSpacing: 0.2,
  },
});
