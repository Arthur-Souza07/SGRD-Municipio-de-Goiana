import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useDeviceType } from '../hooks/useDeviceType';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isMobile: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

function getTimeBasedTheme(): 'light' | 'dark' {
  const hour = new Date().getHours();
  // 6h às 18h = light (dia), 18h às 6h = dark (noite)
  return hour >= 6 && hour < 18 ? 'light' : 'dark';
}

function resolveTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme === 'auto') {
    return getTimeBasedTheme();
  }
  return theme;
}

function getNextThemeBoundary(): number {
  const now = new Date();
  const boundary = new Date(now);
  const hour = now.getHours();

  boundary.setMinutes(0, 0, 0);

  if (hour < 6) {
    boundary.setHours(6);
  } else if (hour < 18) {
    boundary.setHours(18);
  } else {
    boundary.setDate(boundary.getDate() + 1);
    boundary.setHours(6);
  }

  return boundary.getTime() - now.getTime();
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const deviceType = useDeviceType();
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'auto';
    const stored = localStorage.getItem('theme-mode') as ThemeMode | null;
    return stored ?? 'auto';
  });
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem('theme-mode') as ThemeMode | null;
    return resolveTheme(stored ?? 'auto');
  });
  const [mounted, setMounted] = useState(false);

  // Initialize on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('theme-mode') as ThemeMode | null;
    if (stored) {
      setThemeState(stored);
    }
  }, []);

  // Compute resolved theme
  useEffect(() => {
    if (!mounted) return;
    const resolved = resolveTheme(theme);
    setResolvedTheme((current) => current === resolved ? current : resolved);
    if (document.documentElement.getAttribute('data-theme') !== resolved) {
      document.documentElement.setAttribute('data-theme', resolved);
    }
  }, [theme, mounted]);

  // Reprograma apenas para o próximo limite horário (6h ou 18h)
  useEffect(() => {
    if (!mounted || theme !== 'auto') return;

    let timeoutId: number;

    const updateTheme = () => {
      const resolved = getTimeBasedTheme();
      setResolvedTheme((current) => {
        if (current === resolved) return current;
        return resolved;
      });
      if (document.documentElement.getAttribute('data-theme') !== resolved) {
        document.documentElement.setAttribute('data-theme', resolved);
      }
    };

    const scheduleNextUpdate = () => {
      updateTheme();
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(scheduleNextUpdate, getNextThemeBoundary());
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) scheduleNextUpdate();
    };

    scheduleNextUpdate();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [theme, mounted]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('theme-mode', newTheme);

    const resolved = resolveTheme(newTheme);
    setResolvedTheme(resolved);
    if (document.documentElement.getAttribute('data-theme') !== resolved) {
      document.documentElement.setAttribute('data-theme', resolved);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    // Light -> dark -> auto on every device
    const nextTheme: Record<ThemeMode, ThemeMode> = {
      light: 'dark',
      dark: 'auto',
      auto: 'light',
    };
    setTheme(nextTheme[theme]);
  }, [theme, deviceType, setTheme]);

  // Return null for theme during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{
        theme: 'auto',
        resolvedTheme: 'light',
        setTheme: () => {},
        toggleTheme: () => {},
        isMobile: false
      }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
      isMobile: deviceType === 'mobile' || deviceType === 'tablet'
    }}>
      {children}
    </ThemeContext.Provider>
  );
}