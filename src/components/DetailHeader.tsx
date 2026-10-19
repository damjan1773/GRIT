import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../theme/theme';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { Icon } from './Icon';

interface DetailHeaderProps {
  /** Left out where the screen's content already says what it is. */
  title?: string;
  subtitle?: string;
  onBack: () => void;
  /** An action for the top-right corner, level with the back button. */
  right?: React.ReactNode;
}

/** Back button, then a large title — the layout the workout detail uses. */
export function DetailHeader({ title, subtitle, onBack, right }: DetailHeaderProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View>
      <View style={styles.topRow}>
        <Pressable onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Nazad">
          <Icon name="arrow_back" size={20} color={theme.text} />
        </Pressable>
        {right}
      </View>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={[styles.subtitle, !title && styles.subtitleAlone]}>{subtitle}</Text> : null}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.ink(0.12),
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: { fontFamily: 'Poppins_900Black_Italic', fontSize: 28, lineHeight: 34, color: t.text, letterSpacing: -0.3 },
    subtitle: { fontFamily: 'Poppins_500Medium', fontSize: 12.5, lineHeight: 18, color: t.ink(0.5), marginTop: 4 },
    subtitleAlone: { marginTop: 0 },
  });
