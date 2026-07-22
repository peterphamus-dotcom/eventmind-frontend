interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** A search input with a leading magnifier and a clear button. */
export function SearchBar({ value, onChange, placeholder = 'Search…' }: SearchBarProps) {
  return (
    <div style={styles.wrap}>
      <span style={styles.icon} aria-hidden>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={styles.input}
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          style={styles.clear}
          aria-label="Clear search"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '18px',
  },
  icon: {
    position: 'absolute',
    left: '13px',
    pointerEvents: 'none',
    color: 'var(--text-faint)',
    display: 'flex',
  },
  input: {
    width: '100%',
    // index.css forces 16px on inputs to stop iOS Safari zooming on focus,
    // so the design's 15px is not reachable here.
    padding: '11px 36px 11px 38px',
    border: '1px solid var(--border-strong)',
    borderRadius: '9px',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    fontSize: '15px',
    boxSizing: 'border-box',
  },
  clear: {
    position: 'absolute',
    right: '8px',
    width: '26px',
    height: '26px',
    minHeight: '26px',
    border: 'none',
    borderRadius: '6px',
    background: 'transparent',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
