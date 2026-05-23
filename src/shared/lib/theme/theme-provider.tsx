import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { ACCENT_MAP, type ThemeMode, type AccentColor } from './types';
import { ThemeContext } from './theme-context';

function computeIsDark(mode: ThemeMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyAccent(accent: AccentColor) {
  const hex = ACCENT_MAP[accent];
  document.documentElement.style.setProperty('--hf-accent', hex);
  const hoverHex = hex === '#3B82F6' ? '#2563EB'
    : hex === '#22C55E' ? '#16A34A'
    : hex === '#F59E0B' ? '#D97706'
    : hex === '#EF4444' ? '#DC2626'
    : hex === '#A855F7' ? '#9333EA'
    : hex === '#EC4899' ? '#DB2777'
    : hex === '#06B6D4' ? '#0891B2'
    : '#52525B';
  document.documentElement.style.setProperty('--hf-accent-hover', hoverHex);
}

function applyDarkClass(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('appearance.theme') as ThemeMode) || 'auto';
  });
  const [accent, setAccentState] = useState<AccentColor>(() => {
    return (localStorage.getItem('appearance.accent') as AccentColor) || 'blue';
  });
  const [isDark, setIsDark] = useState(() => computeIsDark(mode));

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('appearance.theme', newMode);
    const dark = computeIsDark(newMode);
    setIsDark(dark);
    applyDarkClass(dark);
  }, []);

  const setAccent = useCallback((newAccent: AccentColor) => {
    setAccentState(newAccent);
    localStorage.setItem('appearance.accent', newAccent);
    applyAccent(newAccent);
  }, []);

  useEffect(() => {
    applyDarkClass(isDark);
    applyAccent(accent);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mode === 'auto') {
        const dark = mediaQuery.matches;
        setIsDark(dark);
        applyDarkClass(dark);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode, accent, isDark]);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        setMode,
        accent,
        setAccent,
        accentHex: ACCENT_MAP[accent],
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
