import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '../theme/theme';
import { useThemedStyles } from '../theme/ThemeContext';

interface StatTileProps {
  label: string;
  value: string;
  unit?: string;
  caption?: string;
}

/** Label, value and a quiet caption — one headline number, no chart. */
export function StatTile({ label, value, unit, caption }: StatTileProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.tile}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.value} numberOfLines={1}>
        {value}
        {unit ? <Text style={styles.unit}> {unit}</Text> : null}
      </Text>
      {caption ? (
        <Text style={styles.caption} numberOfLines={1}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    tile: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 18,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.ink(0.07),
    },
    label: { fontFamily: 'Poppins_600SemiBold', fontSize: 10.5, color: t.ink(0.5) },
    value: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 18, color: t.text, marginTop: 4 },
    unit: { fontFamily: 'Poppins_500Medium', fontSize: 11, color: t.ink(0.5) },
    caption: { fontFamily: 'Poppins_400Regular', fontSize: 10.5, color: t.ink(0.45), marginTop: 2 },
  });
