import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';
import { columnPath } from './geometry';

const HEIGHT = 34;
const BAR = 6;
const GAP = 3;

/**
 * The trend on a list card: past days in the de-emphasis gray, the latest in the
 * accent, so the eye lands on "now". Decorative — the card's text carries the number.
 */
export function Sparkline({ values, color, relative = false }: { values: number[]; color: string; relative?: boolean }) {
  const { theme } = useTheme();
  const max = Math.max(1, ...values);
  // Relative bars start below the smallest value rather than at zero: 82 against
  // 81 kg would otherwise draw two identical columns.
  const low = Math.min(...values.filter(v => v > 0));
  const floor = relative && values.length ? Math.max(0, low - Math.max(0.5, (max - low) * 0.6)) : 0;
  const width = values.length * (BAR + GAP) - GAP;
  return (
    // The View hides it from screen readers; Svg would pass these props raw to the DOM on web.
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={HEIGHT}>
        {values.map((value, i) => {
          const last = i === values.length - 1;
          // Empty days keep a 2px stub, so a gap reads as "nothing" rather than a missing bar.
          const height = value > 0 ? Math.max(3, ((value - floor) / (max - floor)) * HEIGHT) : 2;
          const fill = value > 0 ? (last ? color : theme.ink(0.22)) : theme.ink(0.1);
          return <Path key={i} d={columnPath(i * (BAR + GAP), HEIGHT - height, BAR, HEIGHT)} fill={fill} />;
        })}
      </Svg>
    </View>
  );
}
