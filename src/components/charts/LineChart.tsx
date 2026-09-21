import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';
import { niceMax } from '../../utils/stats';

export interface LinePoint {
  key: string;
  value: number;
  /** Short x-axis label. */
  label: string;
  /** Read out when the point is picked. */
  description: string;
  /**
   * Position on a time axis, e.g. a day number. When every point has one, points
   * are spaced by it, so a week without a weigh-in shows as a gap; otherwise they
   * sit evenly, one per session.
   */
  at?: number;
}

interface LineChartProps {
  data: LinePoint[];
  color: string;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  formatTick: (value: number) => string;
  plotHeight?: number;
  /** Gridlines land on multiples of this — 0,5 kg on a body-weight axis, never 0,8 or 0,15. */
  stepUnit?: number;
}

const GUTTER = 42;
const AXIS_BAND = 22;
/** Keeps the end dots, rings included, inside the drawing. */
const INSET = 10;

/**
 * One series over time: 2px line, a 10% wash beneath, dots ringed in the surface
 * colour. The scale hugs the data rather than starting at zero — the change is
 * the point here, not the size of the number.
 */
export function LineChart({ data, color, selectedIndex, onSelect, formatTick, plotHeight = 170, stepUnit = 0 }: LineChartProps) {
  const { theme } = useTheme();
  const [width, setWidth] = useState(0);

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  // Ticks land on a clean step (75 / 90 / 105, not 70,3 / 87,5 / 104,8), with a
  // step of room past the data at either end when it would otherwise touch the edge.
  const rawStep = niceMax((max - min || Math.max(1, max * 0.1)) / 2);
  const step = stepUnit > 0 ? Math.max(1, Math.ceil(rawStep / stepUnit - 1e-9)) * stepUnit : rawStep;
  let lo = Math.floor(min / step) * step;
  if (lo === min) lo = Math.max(0, lo - step);
  let hi = Math.ceil(max / step) * step;
  if (hi === max) hi += step;
  const ticks: number[] = [];
  for (let tick = lo; tick <= hi + step / 2; tick += step) ticks.push(tick);

  const innerWidth = Math.max(0, width - GUTTER - INSET * 2);
  const timed = data.length > 1 && data.every(d => d.at !== undefined);
  const firstAt = timed ? data[0].at! : 0;
  const spanAt = timed ? data[data.length - 1].at! - firstAt : 0;
  const fraction = (i: number) =>
    data.length === 1 ? 0.5 : timed && spanAt > 0 ? (data[i].at! - firstAt) / spanAt : i / (data.length - 1);
  const x = (i: number) => GUTTER + INSET + fraction(i) * innerWidth;
  // Each point answers from halfway to its neighbours, so the hit areas tile the plot.
  const hitEdges = data.map((_, i) => ({
    left: i === 0 ? GUTTER : (x(i - 1) + x(i)) / 2,
    right: i === data.length - 1 ? width : (x(i) + x(i + 1)) / 2,
  }));
  const y = (value: number) => INSET + (1 - (value - lo) / (hi - lo)) * (plotHeight - INSET * 2);

  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(d.value)}`).join('');
  const area = data.length > 1 ? `${line}L${x(data.length - 1)},${plotHeight}L${x(0)},${plotHeight}Z` : '';

  return (
    <View style={{ height: plotHeight + AXIS_BAND }} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && data.length > 0 && (
        <Svg width={width} height={plotHeight + AXIS_BAND}>
          {ticks.map((tick, i) => (
            <React.Fragment key={i}>
              <Line x1={GUTTER} x2={width} y1={y(tick)} y2={y(tick)} stroke={theme.ink(0.08)} strokeWidth={1} />
              <SvgText
                x={GUTTER - 8}
                y={y(tick) + 3.5}
                fontSize={10}
                fontFamily="Poppins_500Medium"
                fill={theme.ink(0.45)}
                textAnchor="end"
              >
                {formatTick(tick)}
              </SvgText>
            </React.Fragment>
          ))}

          {area ? <Path d={area} fill={color} opacity={0.1} /> : null}
          {data.length > 1 && <Path d={line} stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />}

          {selectedIndex !== null && data[selectedIndex] && (
            <Line
              x1={x(selectedIndex)}
              x2={x(selectedIndex)}
              y1={0}
              y2={plotHeight}
              stroke={theme.ink(0.2)}
              strokeWidth={1}
            />
          )}

          {data.map((d, i) => (
            <Circle
              key={d.key}
              cx={x(i)}
              cy={y(d.value)}
              r={i === selectedIndex ? 6 : 4}
              fill={color}
              stroke={theme.surface}
              strokeWidth={2}
            />
          ))}

          {data.map((d, i) => {
            // First, last and the picked point only — a date under every dot is noise.
            const shown = i === 0 || i === data.length - 1 || i === selectedIndex;
            if (!shown) return null;
            const anchor = i === 0 && data.length > 1 ? 'start' : i === data.length - 1 && data.length > 1 ? 'end' : 'middle';
            return (
              <SvgText
                key={`label-${d.key}`}
                x={anchor === 'start' ? x(i) - INSET : anchor === 'end' ? x(i) + INSET : x(i)}
                y={plotHeight + 15}
                fontSize={10}
                fontFamily="Poppins_500Medium"
                fill={i === selectedIndex ? theme.text : theme.ink(0.45)}
                textAnchor={anchor}
              >
                {d.label}
              </SvgText>
            );
          })}
        </Svg>
      )}

      <View style={StyleSheet.absoluteFill}>
        {width > 0 && data.map((d, i) => (
          <Pressable
            key={d.key}
            style={[styles.hit, { left: hitEdges[i].left, width: Math.max(0, hitEdges[i].right - hitEdges[i].left) }]}
            onPress={() => onSelect(i)}
            accessibilityRole="button"
            accessibilityLabel={d.description}
            accessibilityState={{ selected: selectedIndex === i }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hit: { position: 'absolute', top: 0, bottom: 0 },
});
