export type ThemeMode = 'light' | 'dark' | 'auto';

export type AccentColor = 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'pink' | 'teal' | 'gray';

export const ACCENT_MAP: Record<AccentColor, string> = {
  blue: '#3B82F6',
  green: '#22C55E',
  amber: '#F59E0B',
  red: '#EF4444',
  violet: '#A855F7',
  pink: '#EC4899',
  teal: '#06B6D4',
  gray: '#6B7785',
};
