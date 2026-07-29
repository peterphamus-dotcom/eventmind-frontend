import { useLowData } from '../LowDataContext';

const DataIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20h.01" />
    <path d="M7 20v-4" />
    <path d="M12 20v-8" />
    <path d="M17 20V8" />
    <path d="M22 20V4" />
  </svg>
);

const DataOffIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20h.01" />
    <path d="M7 20v-4" />
    <path d="M12 20v-8" />
    <path d="M17 20V8" />
    <path d="M22 20V4" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

/** Floating button, next to the theme toggle, that switches Low Data Mode on/off. */
export function LowDataToggle() {
  const { lowData, toggleLowData } = useLowData();

  return (
    <button
      onClick={toggleLowData}
      aria-label={lowData ? 'Turn off low data mode' : 'Turn on low data mode'}
      title={lowData ? 'Turn off low data mode' : 'Turn on low data mode'}
      style={{ ...styles.button, ...(lowData ? styles.buttonActive : {}) }}
    >
      {lowData ? DataOffIcon : DataIcon}
    </button>
  );
}

const styles = {
  button: {
    position: 'fixed' as const,
    left: 'clamp(68px, 4vw + 52px, 84px)',
    bottom: 'clamp(16px, 4vw, 32px)',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: '1px solid var(--border-strong)',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    cursor: 'pointer',
    boxShadow: '0 4px 20px oklch(0% 0 0 / 0.1)',
    zIndex: 500,
  },
  buttonActive: {
    backgroundColor: 'var(--accent)',
    color: 'white',
    borderColor: 'var(--accent)',
  },
};
