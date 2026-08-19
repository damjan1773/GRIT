import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { MealEntryScreen } from '../screens/MealEntryScreen';
import { ComingSoonScreen } from '../screens/ComingSoonScreen';
import { BottomNav } from '../components/BottomNav';
import { useAppData } from '../context/AppDataContext';

const Tab = createBottomTabNavigator();

export function RootNavigator() {
  const { profile } = useAppData();

  return (
    <Tab.Navigator
      initialRouteName={profile ? 'Dashboard' : 'Onboarding'}
      screenOptions={{ headerShown: false }}
      tabBar={props => <BottomNav {...props} />}
    >
      <Tab.Screen name="Onboarding" component={OnboardingScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="MealEntry" component={MealEntryScreen} />
      <Tab.Screen name="Stats">{() => <ComingSoonScreen label="Statistika" icon="bar_chart" />}</Tab.Screen>
      <Tab.Screen name="Settings">{() => <ComingSoonScreen label="Podešavanja" icon="settings" />}</Tab.Screen>
    </Tab.Navigator>
  );
}
