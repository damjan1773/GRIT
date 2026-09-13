import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ProfileTabScreen } from '../screens/ProfileTabScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { MealEntryScreen } from '../screens/MealEntryScreen';
import { ComingSoonScreen } from '../screens/ComingSoonScreen';
import { BottomNav } from '../components/BottomNav';
import { useAppData } from '../context/AppDataContext';
import { useTheme } from '../theme/ThemeContext';

const Tab = createBottomTabNavigator();

export function RootNavigator() {
  const { profile } = useAppData();
  const { theme } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <Tab.Navigator
        initialRouteName={profile ? 'Dashboard' : 'Profile'}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: theme.bg } }}
        tabBar={props => <BottomNav {...props} />}
      >
        <Tab.Screen name="Profile" component={ProfileTabScreen} />
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="MealEntry" component={MealEntryScreen} />
        <Tab.Screen name="Stats">{() => <ComingSoonScreen label="Statistika" icon="bar_chart" />}</Tab.Screen>
        <Tab.Screen name="Settings">{() => <ComingSoonScreen label="Podešavanja" icon="settings" />}</Tab.Screen>
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
