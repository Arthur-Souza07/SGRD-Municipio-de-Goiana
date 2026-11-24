import { useTheme as useThemeContext } from '../context/ThemeContext';

/**
 * Hook to consume the theme context
 * Re-exports the context hook with a cleaner import path
 */
export function useTheme() {
  return useThemeContext();
}

export type { ThemeMode } from '../context/ThemeContext';