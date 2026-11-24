import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function ThemeToggle() {
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  const getIcon = () => {
    switch (resolvedTheme) {
      case 'light':
        return <Sun size={20} strokeWidth={2} aria-hidden="true" />;
      case 'dark':
        return <Moon size={20} strokeWidth={2} aria-hidden="true" />;
      default:
        return <Monitor size={20} strokeWidth={2} aria-hidden="true" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Modo claro (clique para escuro)';
      case 'dark':
        return 'Modo escuro (clique para automático)';
      case 'auto':
        return 'Automático (clique para claro)';
    }
  };

  const getShortLabel = () => {
    switch (theme) {
      case 'light':
        return 'Claro';
      case 'dark':
        return 'Escuro';
      case 'auto':
        return 'Auto';
    }
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={getLabel()}
      title={getLabel()}
      data-theme={theme}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {getIcon()}
      </span>
      <span className="theme-toggle-label">{getShortLabel()}</span>
    </button>
  );
}

export default ThemeToggle;