import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradientColors, gradientLocations } from '../theme/colors';
import { Theme } from '../theme/theme';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { Icon } from './Icon';

interface StepperButtonProps {
  icon: 'add' | 'remove';
  onPress: () => void;
  filled?: boolean;
}

export function StepperButton({ icon, onPress, filled }: StepperButtonProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);

  if (filled) {
    return (
      <Pressable onPress={onPress}>
        <LinearGradient
          colors={gradientColors}
          locations={gradientLocations}
          start={{ x: 0, y: 0.2 }}
          end={{ x: 1, y: 0.8 }}
          style={styles.btn}
        >
          <Icon name={icon} size={22} color="#101012" />
        </LinearGradient>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onPress} style={[styles.btn, styles.outline]}>
      <Icon name={icon} size={22} color={theme.text} />
    </Pressable>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    btn: {
      width: 44,
      height: 44,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    outline: {
      borderWidth: 1,
      borderColor: t.ink(0.13),
      backgroundColor: 'transparent',
    },
  });

export function StepperRow({ children }: { children: React.ReactNode }) {
  return <View style={styles2.row}>{children}</View>;
}

const styles2 = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
