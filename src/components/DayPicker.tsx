import React, { useRef } from 'react';
import { LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradientColors, gradientLocations } from '../theme/colors';
import { dayOfMonth, shiftDateKey, weekdayShort } from '../utils/dates';

const DAYS_EACH_WAY = 7;
const CHIP_WIDTH = 52;
const CHIP_GAP = 8;
/** Matches the dashboard's side padding, so the strip can scroll edge to edge. */
const EDGE_PADDING = 22;

interface DayPickerProps {
  todayKey: string;
  selectedDateKey: string;
  onSelect: (dateKey: string) => void;
}

/** Horizontal strip of today and a week either side. */
export function DayPicker({ todayKey, selectedDateKey, onSelect }: DayPickerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const days = Array.from({ length: DAYS_EACH_WAY * 2 + 1 }, (_, i) => shiftDateKey(todayKey, i - DAYS_EACH_WAY));

  // Open with the selected day in the middle rather than scrolled to a week ago.
  function centreSelected(e: LayoutChangeEvent) {
    const index = Math.max(0, days.indexOf(selectedDateKey));
    const x = EDGE_PADDING + index * (CHIP_WIDTH + CHIP_GAP) - (e.nativeEvent.layout.width - CHIP_WIDTH) / 2;
    scrollRef.current?.scrollTo({ x: Math.max(0, x), animated: false });
  }

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      onLayout={centreSelected}
      style={styles.strip}
      contentContainerStyle={styles.content}
    >
      {days.map(key => {
        const selected = key === selectedDateKey;
        const isToday = key === todayKey;
        const face = (
          <>
            <Text style={[styles.weekday, selected && styles.onGradient]}>{weekdayShort(key)}</Text>
            <Text style={[styles.dayNumber, selected && styles.onGradient]}>{dayOfMonth(key)}</Text>
            <View style={[styles.todayDot, !isToday && styles.hidden, selected && styles.todayDotOnGradient]} />
          </>
        );
        return (
          <Pressable key={key} onPress={() => onSelect(key)} accessibilityRole="button" accessibilityState={{ selected }}>
            {selected ? (
              <LinearGradient colors={gradientColors} locations={gradientLocations} style={styles.chip}>
                {face}
              </LinearGradient>
            ) : (
              <View style={[styles.chip, styles.chipIdle, isToday && styles.chipToday]}>{face}</View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: { marginHorizontal: -EDGE_PADDING, marginBottom: 20 },
  content: { paddingHorizontal: EDGE_PADDING, gap: CHIP_GAP },
  chip: {
    width: CHIP_WIDTH,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  chipIdle: { backgroundColor: '#17171A', borderColor: 'rgba(255,255,255,0.07)' },
  chipToday: { borderColor: 'rgba(143,233,206,0.45)' },
  weekday: { fontFamily: 'Poppins_600SemiBold', fontSize: 10.5, color: 'rgba(255,255,255,0.45)' },
  dayNumber: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 18, color: '#fff', marginTop: 2 },
  onGradient: { color: '#101012' },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.mint, marginTop: 4 },
  todayDotOnGradient: { backgroundColor: '#101012' },
  hidden: { opacity: 0 },
});
