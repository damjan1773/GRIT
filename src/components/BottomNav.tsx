import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gradientColors, gradientLocations } from '../theme/colors';
import { Icon } from './Icon';

const TAB_ICON: Record<string, string> = {
  Onboarding: 'person',
  Dashboard: 'restaurant_menu',
  MealEntry: 'add',
  Stats: 'bar_chart',
  Settings: 'settings',
};

export function BottomNav({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeRouteName = state.routes[state.index].name;
  if (activeRouteName === 'Onboarding') return null;

  return (
    <LinearGradient
      colors={gradientColors}
      locations={gradientLocations}
      start={{ x: 0, y: 0.2 }}
      end={{ x: 1, y: 0.8 }}
      style={[styles.bar, { height: 98 + insets.bottom, paddingBottom: 24 + insets.bottom }]}
    >
      {state.routes.map((route, index) => {
        const focused = index === state.index;
        const isCenter = route.name === 'MealEntry';
        const icon = TAB_ICON[route.name] ?? 'circle';

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        if (isCenter) {
          return (
            <Pressable key={route.key} onPress={onPress} style={styles.centerBtn}>
              <Icon name="add" size={32} color="#fff" />
            </Pressable>
          );
        }

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.tabBtn}>
            <View style={[styles.tabHighlight, { opacity: focused ? 1 : 0 }]} />
            <Icon name={icon} size={26} color="#101012" />
          </Pressable>
        );
      })}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderBottomLeftRadius: 48,
    borderBottomRightRadius: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -14 },
    shadowOpacity: 0.45,
    shadowRadius: 34,
    elevation: 10,
  },
  tabBtn: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 17,
    backgroundColor: 'rgba(16,16,18,0.13)',
  },
  centerBtn: {
    width: 66,
    height: 66,
    marginTop: -26,
    borderRadius: 33,
    backgroundColor: '#101012',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.8,
    shadowRadius: 36,
    elevation: 12,
  },
});
