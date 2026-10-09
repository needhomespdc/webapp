// Kept apart from the provider component so React Fast Refresh can hot-reload the provider
// file (a file that exports both components and other values forces a full reload).
import { createContext } from 'react';

export type Theme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
