import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

interface GradientTileProps {
  /** Its stretch of the brand gradient, left to right. */
  gradient: [string, string, ...string[]];
  /** The colour it casts beneath it — its own hue, so it glows rather than greys. */
  glow: string;
  /** Padding and alignment of the content inside. */
  contentStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

const RADIUS = 22;

/**
 * A raised tile: its slice of the gradient, a gloss across the top as if lit
 * from above, a bright rim, and a soft shadow underneath. It fills its share
 * of a row, so three side by side split the width evenly.
 */
export function GradientTile({ gradient, glow, contentStyle, children }: GradientTileProps) {
  const { theme } = useTheme();
  const dark = theme.mode === 'dark';
  return (
    <View
      style={[
        styles.lift,
        {
          // Just enough to lift the tile off the card: a wider or stronger glow
          // blurred its edges, most of all on the profile's goal card. Dark casts the
          // tile's own colour, since black vanishes there; white gets a faint grey.
          // One boxShadow string draws the same on iOS, Android and the web.
          boxShadow: dark ? `0px 3px 7px ${glow}24` : '0px 3px 7px #10101214',
        },
      ]}
    >
      <LinearGradient colors={gradient} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[styles.tile, contentStyle]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.42)', 'rgba(255,255,255,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gloss}
          pointerEvents="none"
        />
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  lift: { flex: 1, borderRadius: RADIUS },
  tile: {
    borderRadius: RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  gloss: { position: 'absolute', left: 0, right: 0, top: 0, height: '55%' },
});
