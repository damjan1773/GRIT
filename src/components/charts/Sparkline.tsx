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
export function Sparkline({ values, color }: { values: number[]; color: string }) {
  const { theme } = useTheme();
  const max = Math.max(1, ...values);
  const width = values.length * (BAR + GAP) - GAP;
  return (
    // The View hides it from screen readers; Svg would pass these props raw to the DOM on web.
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={HEIGHT}>
        {values.map((value, i) => {
          const last = i === values.length - 1;
          // Empty days keep a 2px stub, so a gap reads as "nothing" rather than a missing bar.
          const height = value > 0 ? Math.max(3, (value / max) * HEIGHT) : 2;
          const fill = value > 0 ? (last ? color : theme.ink(0.22)) : theme.ink(0.1);
          return <Path key={i} d={columnPath(i * (BAR + GAP), HEIGHT - height, BAR, HEIGHT)} fill={fill} />;
        })}
      </Svg>
    </View>
  );
}
