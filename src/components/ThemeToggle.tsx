import { useTheme } from '../ThemeContext';

/** Floating button, bottom-left, that switches between light and dark mode. */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      style={styles.button}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}

const styles = {
  button: {
    position: 'fixed' as const,
    left: 'clamp(16px, 4vw, 32px)',
    bottom: 'clamp(16px, 4vw, 32px)',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: '1px solid var(--border-strong)',
    backgroundColor: 'var(--surface)',
    fontSize: '18px',
    lineHeight: 1,
    cursor: 'pointer',
    boxShadow: '0 2px 10px var(--shadow)',
    zIndex: 500,
  },
};
