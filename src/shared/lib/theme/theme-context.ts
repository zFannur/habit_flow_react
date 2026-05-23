import { createContext, useContext } from 'react';
import type { ThemeMode, AccentColor } from './types';

export interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  accent: AccentColor;
  setAccent: (accent: AccentColor) => void;
  accentHex: string;
  isDark: boolean;
}

export const ThemeContext = createContext<ThemeContextValue>({
  mode: 'auto',
  setMode: () => {},
  accent: 'blue',
  setAccent: () => {},
  accentHex: '#3B82F6',
  isDark: false,
});

export function useTheme() {
  return useContext(ThemeContext);
}
