import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadThemeMode, saveThemeMode } from '../services/storage';
import { darkTheme, lightTheme, Theme, ThemeMode } from './theme';

interface ThemeContextValue {
  theme: Theme;
  setMode: (mode: ThemeMode) => void;
  /** False until the saved choice is read, so a light-theme user doesn't see a dark flash. */
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadThemeMode()
      .then(saved => {
        if (saved) setModeState(saved);
      })
      .finally(() => setReady(true));
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    saveThemeMode(next);
  }, []);

  const value = useMemo(
    () => ({ theme: mode === 'light' ? lightTheme : darkTheme, setMode, ready }),
    [mode, setMode, ready]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

/** A StyleSheet built from the active theme, rebuilt only when the theme changes. */
export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const { theme } = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}
