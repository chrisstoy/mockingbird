'use client';
import { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme-mode';
const LIGHT_THEME = 'mockingbird';
const DARK_THEME = 'mockingbird-dark';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setMode: (_mode: ThemeMode) => {},
  resolvedTheme: 'light',
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch (_e) { /* localStorage unavailable */ }
  return 'system';
}

function getSystemPreference(): 'light' | 'dark' {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  } catch (_e) { /* matchMedia unavailable */ }
  return 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getStoredMode);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Apply theme to <html> data-theme attribute
  function applyTheme(m: ThemeMode) {
    const resolved = m === 'system' ? getSystemPreference() : m;
    const themeName = resolved === 'dark' ? DARK_THEME : LIGHT_THEME;
    document.documentElement.setAttribute('data-theme', themeName);
    setResolvedTheme(resolved);
  }

  // On mount: apply stored theme and listen for OS preference changes
  useEffect(() => {
    applyTheme(getStoredMode()); // eslint-disable-line react-hooks/set-state-in-effect -- applyTheme sets resolvedTheme to sync DOM data-theme with React state on mount

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (getStoredMode() === 'system') applyTheme('system');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const setMode = (newMode: ThemeMode) => {
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch (_e) { /* localStorage unavailable */ }
    setModeState(newMode);
    applyTheme(newMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, setMode, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
