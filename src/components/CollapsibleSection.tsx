import { useState } from 'react';

interface Props {
  title: string;
  count?: number;
  /** localStorage key suffix so the open/closed state survives reloads. */
  storageKey: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function readStored(key: string, fallback: boolean): boolean {
  const stored = localStorage.getItem(key);
  if (stored === null) return fallback;
  return stored === 'open';
}

/** A titled section the user can collapse to hide its contents; state persists per-section. */
export function CollapsibleSection({ title, count, storageKey, defaultOpen = true, children }: Props) {
  const key = `collapsed:${storageKey}`;
  const [open, setOpen] = useState(() => readStored(key, defaultOpen));

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      localStorage.setItem(key, next ? 'open' : 'closed');
      return next;
    });
  }

  return (
    <div style={styles.section}>
      <button type="button" onClick={toggle} style={styles.header} aria-expanded={open}>
        <span style={{ ...styles.chevron, transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          ▶
        </span>
        <span style={styles.title}>{title}</span>
        {count !== undefined && <span style={styles.count}>{count}</span>}
      </button>
      {open && <div style={styles.body}>{children}</div>}
    </div>
  );
}

const styles = {
  section: {
    marginBottom: '24px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '4px 0 10px',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--border)',
    marginBottom: '10px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    color: 'inherit',
  },
  chevron: {
    fontSize: '10px',
    color: 'var(--text-faint)',
    transition: 'transform 0.15s ease',
    flexShrink: 0,
  },
  title: {
    fontSize: '14px',
    fontWeight: '700' as const,
    color: 'var(--text-muted)',
    flex: 1,
  },
  count: {
    fontSize: '12px',
    fontWeight: '600' as const,
    color: 'var(--text-faint)',
    backgroundColor: 'var(--bg)',
    borderRadius: '10px',
    padding: '2px 8px',
  },
  body: {},
};
