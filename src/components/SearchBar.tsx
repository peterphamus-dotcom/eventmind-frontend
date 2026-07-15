interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** A search input with a leading magnifier and a clear button. */
export function SearchBar({ value, onChange, placeholder = 'Search…' }: SearchBarProps) {
  return (
    <div style={styles.wrap}>
      <span style={styles.icon} aria-hidden>🔍</span>
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
          ✕
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
    marginBottom: '16px',
  },
  icon: {
    position: 'absolute',
    left: '12px',
    fontSize: '14px',
    pointerEvents: 'none',
    opacity: 0.7,
  },
  input: {
    width: '100%',
    padding: '10px 36px',
    border: '1px solid var(--border-strong)',
    borderRadius: '6px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    fontSize: '16px',
  },
  clear: {
    position: 'absolute',
    right: '8px',
    width: '28px',
    height: '28px',
    minHeight: '28px',
    border: 'none',
    borderRadius: '4px',
    background: 'transparent',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '13px',
  },
};
