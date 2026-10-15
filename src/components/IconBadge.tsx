import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { SymbolView } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import { chartColors, gradientColors, gradientLocations } from '../theme/colors';
import { IconHue, iconHue } from '../theme/iconHues';
import { Theme } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';

/**
 * 'gradient' fills every icon with the app's mint-to-lavender, like the avatar,
 * the calorie ring and the tab bar; 'hue' gives each category its own colour.
 */
const ICON_FILL: 'gradient' | 'hue' = 'gradient';

interface IconBadgeProps {
  /** SF Symbol name, drawn on iOS — the same glyphs Apple's own apps use. */
  symbol: SFSymbol;
  /** Material icon for Android and the web preview, where SF Symbols don't exist. */
  icon: string;
  /** The category colour, used when ICON_FILL is 'hue'. */
  hue: IconHue;
  /** Side of the square slot the glyph is centred in, so labels beside it line up. */
  size?: number;
  iconSize?: number;
}

/**
 * The brand gradient as it reads on each theme: the pastels on dark, and on white
 * the darker steps of the same two hues, which the pastels would vanish against.
 */
function iconGradient(theme: Theme): { colors: [string, string, ...string[]]; locations?: [number, number, ...number[]] } {
  return theme.mode === 'dark'
    ? { colors: gradientColors, locations: gradientLocations }
    : { colors: [chartColors.nutrition, chartColors.training] };
}

/** A category icon: the bare glyph, filled with the brand gradient or its own hue. */
export function IconBadge({ symbol, icon, hue, size = 34, iconSize = 28 }: IconBadgeProps) {
  const { theme } = useTheme();

  const glyph = (color: string) => (
    <SymbolView
      name={{ ios: symbol }}
      size={iconSize}
      tintColor={color}
      weight="semibold"
      // Only iOS has the symbol; elsewhere the fallback draws instead.
      fallback={<Icon name={icon} size={iconSize} color={color} />}
    />
  );

  if (ICON_FILL === 'hue') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        {glyph(iconHue(hue, theme.mode))}
      </View>
    );
  }

  const { colors, locations } = iconGradient(theme);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* The glyph is the stencil and the gradient shows through it. The web build
          can't mask and draws the stencil itself, so it gets the theme accent. */}
      <MaskedView
        style={{ width: iconSize, height: iconSize }}
        maskElement={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>{glyph(theme.accent)}</View>
        }
      >
        <LinearGradient colors={colors} locations={locations} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
      </MaskedView>
    </View>
  );
}
