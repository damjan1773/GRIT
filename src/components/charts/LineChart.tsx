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
}

interface LineChartProps {
  data: LinePoint[];
  color: string;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  formatTick: (value: number) => string;
  plotHeight?: number;
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
export function LineChart({ data, color, selectedIndex, onSelect, formatTick, plotHeight = 170 }: LineChartProps) {
  const { theme } = useTheme();
  const [width, setWidth] = useState(0);

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  // Ticks land on a clean step (75 / 90 / 105, not 70,3 / 87,5 / 104,8), with a
  // step of room past the data at either end when it would otherwise touch the edge.
  const step = niceMax((max - min || Math.max(1, max * 0.1)) / 2);
  let lo = Math.floor(min / step) * step;
  if (lo === min) lo = Math.max(0, lo - step);
  let hi = Math.ceil(max / step) * step;
  if (hi === max) hi += step;
  const ticks: number[] = [];
  for (let tick = lo; tick <= hi + step / 2; tick += step) ticks.push(tick);

  const innerWidth = Math.max(0, width - GUTTER - INSET * 2);
  const x = (i: number) => GUTTER + INSET + (data.length === 1 ? innerWidth / 2 : (i * innerWidth) / (data.length - 1));
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

      <View style={[StyleSheet.absoluteFill, styles.hitRow, { left: GUTTER }]}>
        {data.map((d, i) => (
          <Pressable
            key={d.key}
            style={styles.hit}
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
  hitRow: { flexDirection: 'row' },
  hit: { flex: 1 },
});
