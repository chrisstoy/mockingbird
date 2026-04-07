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
  setMode: () => {},
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
  } catch {}
  return 'system';
}

function getSystemPreference(): 'light' | 'dark' {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  } catch {}
  return 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Apply theme to <html> data-theme attribute
  function applyTheme(m: ThemeMode) {
    const resolved = m === 'system' ? getSystemPreference() : m;
    const themeName = resolved === 'dark' ? DARK_THEME : LIGHT_THEME;
    document.documentElement.setAttribute('data-theme', themeName);
    setResolvedTheme(resolved);
  }

  // On mount: read from localStorage, apply
  useEffect(() => {
    const stored = getStoredMode();
    setModeState(stored);
    applyTheme(stored);

    // Listen for OS preference changes when in system mode
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
    } catch {}
    setModeState(newMode);
    applyTheme(newMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, setMode, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
