import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { Theme } from '../theme/theme';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { Icon } from './Icon';

interface DetailHeaderProps {
  title: string;
  /** Short context shown in the pill beside the back button. */
  tag: string;
  subtitle?: string;
  onBack: () => void;
}

/** Back button and tag, then a large title — the layout the workout detail uses. */
export function DetailHeader({ title, tag, subtitle, onBack }: DetailHeaderProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View>
      <View style={styles.row}>
        <Pressable onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Nazad">
          <Icon name="arrow_back" size={20} color={theme.text} />
        </Pressable>
        <View style={styles.tagPill}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.ink(0.12),
      alignItems: 'center',
      justifyContent: 'center',
    },
    tagPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, backgroundColor: 'rgba(143,233,206,0.13)' },
    tagText: { fontFamily: 'Poppins_700Bold', fontSize: 11, color: t.mode === 'light' ? t.ink(0.7) : colors.mint },
    title: { fontFamily: 'Poppins_900Black_Italic', fontSize: 28, lineHeight: 34, color: t.text, letterSpacing: -0.3 },
    subtitle: { fontFamily: 'Poppins_500Medium', fontSize: 12.5, lineHeight: 18, color: t.ink(0.5), marginTop: 4 },
  });
