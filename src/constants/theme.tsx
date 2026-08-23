import { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import type { ReactNode } from 'react';
import { darkColors, lightColors, type ThemeColors } from './themeColors';

const ThemeContext = createContext<ThemeColors>(lightColors);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const colors = useMemo(() => (scheme === 'dark' ? darkColors : lightColors), [scheme]);
  return <ThemeContext.Provider value={colors}>{children}</ThemeContext.Provider>;
}

export function useThemeColors(): ThemeColors {
  return useContext(ThemeContext);
}
