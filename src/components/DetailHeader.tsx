import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../theme/theme';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { Icon } from './Icon';

interface DetailHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
}

/** Back button, then a large title — the layout the workout detail uses. */
export function DetailHeader({ title, subtitle, onBack }: DetailHeaderProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View>
      <Pressable onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Nazad">
        <Icon name="arrow_back" size={20} color={theme.text} />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.ink(0.12),
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    title: { fontFamily: 'Poppins_900Black_Italic', fontSize: 28, lineHeight: 34, color: t.text, letterSpacing: -0.3 },
    subtitle: { fontFamily: 'Poppins_500Medium', fontSize: 12.5, lineHeight: 18, color: t.ink(0.5), marginTop: 4 },
  });
