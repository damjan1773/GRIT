import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_700Bold_Italic,
  Poppins_800ExtraBold,
  Poppins_800ExtraBold_Italic,
  Poppins_900Black_Italic,
} from '@expo-google-fonts/poppins';
import { AppDataProvider, useAppData } from './src/context/AppDataContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme/colors';
import { darkTheme } from './src/theme/theme';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

function AppInner() {
  const { loading } = useAppData();
  const { theme, ready } = useTheme();

  const navTheme = useMemo(() => {
    const base = theme.mode === 'light' ? DefaultTheme : DarkTheme;
    return { ...base, colors: { ...base.colors, background: theme.bg, card: theme.bg } };
  }, [theme]);

  if (loading || !ready) return <SplashLoader />;
  return (
    <NavigationContainer theme={navTheme}>
      <RootNavigator />
      <StatusBar style={theme.statusBar} />
    </NavigationContainer>
  );
}

function SplashLoader() {
  return (
    <View style={styles.splash}>
      <ActivityIndicator color={colors.mint} />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_700Bold_Italic,
    Poppins_800ExtraBold,
    Poppins_800ExtraBold_Italic,
    Poppins_900Black_Italic,
  });

  if (!fontsLoaded) return <SplashLoader />;

  return (
    <ThemeProvider>
      <AppDataProvider>
        <AppInner />
      </AppDataProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  // Shown before the saved theme is known, so it keeps the default.
  splash: { flex: 1, backgroundColor: darkTheme.bg, alignItems: 'center', justifyContent: 'center' },
});
