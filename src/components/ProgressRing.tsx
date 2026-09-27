import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, FeDropShadow, Filter, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0..1, and past 1 when the goal is passed
  children?: React.ReactNode;
}

export function ProgressRing({ size = 210, strokeWidth = 17, progress, children }: ProgressRingProps) {
  const { theme } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const total = Math.max(0, progress);
  const firstLap = Math.min(1, total);
  // Past the goal the ring is already full, so the surplus goes round a second
  // time over the first — only the head moves, and that is what tells 101% from 130%.
  const secondLap = Math.min(1, Math.max(0, total - 1));
  const lead = secondLap > 0 ? secondLap : firstLap;

  // The head's position and the direction it travels in, for a shadow that falls
  // ahead of it rather than around it.
  const angle = lead * 2 * Math.PI;
  const headX = center + radius * Math.cos(angle);
  const headY = center + radius * Math.sin(angle);
  const reach = strokeWidth * 0.34;

  const arc = (fraction: number) => ({
    cx: center,
    cy: center,
    r: radius,
    fill: 'none' as const,
    stroke: 'url(#ringGrad)',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeDasharray: `${circumference}, ${circumference}`,
    strokeDashoffset: circumference * (1 - fraction),
  });

  /**
   * Sits under the line, so the line itself covers it and its shadow behind the
   * head; what is left is the shadow cast onto the lap below, in front of the head.
   */
  const headShadow = total > 0 && (
    <Circle cx={headX} cy={headY} r={strokeWidth / 2} fill="url(#ringGrad)" filter="url(#headShadow)" />
  );

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* The whole drawing is rotated, so the line starts at 12 o'clock and the
          gradient lies the same way across the line and its head. */}
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={colors.mint} />
            <Stop offset="52%" stopColor={colors.mid} />
            <Stop offset="100%" stopColor={colors.lav} />
          </LinearGradient>
          <Filter id="headShadow" x="-80%" y="-80%" width="260%" height="260%">
            {/* Offset along the direction of travel: the tangent at the head. */}
            <FeDropShadow
              dx={-Math.sin(angle) * reach}
              dy={Math.cos(angle) * reach}
              stdDeviation={strokeWidth * 0.2}
              floodColor="#000"
              floodOpacity="0.6"
            />
          </Filter>
        </Defs>

        <Circle cx={center} cy={center} r={radius} fill="none" stroke={theme.ink(0.07)} strokeWidth={strokeWidth} />
        {secondLap > 0 && <Circle {...arc(firstLap)} />}
        {headShadow}
        {lead > 0 && <Circle {...arc(lead)} />}
      </Svg>
      {children}
    </View>
  );
}
