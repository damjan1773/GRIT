import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';
import { niceMax } from '../../utils/stats';
import { columnPath } from './geometry';

export interface BarDatum {
  key: string;
  value: number;
  /** Short x-axis label. */
  label: string;
  /** Read out when the bar is picked, e.g. "Uto 16.9.: 2.410 kcal". */
  description: string;
}

interface BarChartProps {
  data: BarDatum[];
  color: string;
  /** Drawn as a labelled reference line when given. */
  goal?: number;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  /** Label every nth bar on the x axis; the last one is always labelled. */
  labelEvery?: number;
  formatTick: (value: number) => string;
  plotHeight?: number;
}

const GUTTER = 42;
const AXIS_BAND = 22;
/** Room above the top gridline, so its tick label isn't cut in half. */
const PAD_TOP = 10;
const MAX_BAR = 24;
const BAR_GAP = 2;

/** One series of columns over days. Single series, so no legend: the screen title names it. */
export function BarChart({
  data,
  color,
  goal,
  selectedIndex,
  onSelect,
  labelEvery = 1,
  formatTick,
  plotHeight = 170,
}: BarChartProps) {
  const { theme } = useTheme();
  const [width, setWidth] = useState(0);

  const plotWidth = Math.max(0, width - GUTTER);
  const slot = data.length ? plotWidth / data.length : 0;
  const barWidth = Math.max(2, Math.min(MAX_BAR, slot - BAR_GAP));
  const top = niceMax(Math.max(0, ...data.map(d => d.value), goal ? goal * 1.1 : 0));
  const y = (value: number) => PAD_TOP + (1 - value / top) * (plotHeight - PAD_TOP);
  const ticks = [0, top / 2, top];
  /** A tick whose label would collide with the goal's gives way — the goal says more. */
  const tickLabelHidden = (tick: number) => goal !== undefined && Math.abs(y(tick) - y(goal)) < 12;

  return (
    // The height includes the x-axis band, so the labels never fall outside the card.
    <View style={{ height: plotHeight + AXIS_BAND }} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg width={width} height={plotHeight + AXIS_BAND}>
          {ticks.map(tick => (
            <React.Fragment key={tick}>
              <Line x1={GUTTER} x2={width} y1={y(tick)} y2={y(tick)} stroke={theme.ink(0.08)} strokeWidth={1} />
              {!tickLabelHidden(tick) && (
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
              )}
            </React.Fragment>
          ))}

          {/* The picked day gets a quiet band behind it; the bars themselves stay full strength. */}
          {selectedIndex !== null && data[selectedIndex] ? (
            <Rect
              x={GUTTER + selectedIndex * slot}
              y={0}
              width={slot}
              height={plotHeight}
              rx={Math.min(6, slot / 2)}
              fill={theme.ink(0.07)}
            />
          ) : null}

          {data.map((d, i) => {
            if (d.value <= 0) return null;
            const x = GUTTER + i * slot + (slot - barWidth) / 2;
            return <Path key={d.key} d={columnPath(x, y(d.value), barWidth, plotHeight)} fill={color} />;
          })}

          {goal ? (
            <>
              <Line x1={GUTTER} x2={width} y1={y(goal)} y2={y(goal)} stroke={theme.ink(0.45)} strokeWidth={1} />
              {/* In the tick gutter: no bar can ever sit under it there. */}
              <SvgText
                x={GUTTER - 8}
                y={y(goal) + 3.5}
                fontSize={10}
                fontFamily="Poppins_700Bold"
                fill={theme.ink(0.7)}
                textAnchor="end"
              >
                cilj
              </SvgText>
            </>
          ) : null}

          {data.map((d, i) => {
            const last = i === data.length - 1;
            if (!last && i % labelEvery !== 0) return null;
            return (
              <SvgText
                key={`label-${d.key}`}
                x={GUTTER + i * slot + slot / 2}
                y={plotHeight + 15}
                fontSize={10}
                fontFamily="Poppins_500Medium"
                fill={i === selectedIndex ? theme.text : theme.ink(0.45)}
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            );
          })}
        </Svg>
      )}

      {/* The hit areas tile the whole plot, so the nearest day answers wherever the finger lands. */}
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
