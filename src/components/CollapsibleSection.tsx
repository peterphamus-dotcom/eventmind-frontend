import { useState } from 'react';

interface Props {
  title: string;
  count?: number;
  /** Optional glyph between the chevron and the title (pin, star, …). */
  icon?: React.ReactNode;
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
export function CollapsibleSection({
  title,
  count,
  icon,
  storageKey,
  defaultOpen = true,
  children,
}: Props) {
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
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </span>
        {icon}
        <span style={styles.title}>{title}</span>
        {count !== undefined && <span style={styles.count}>{count}</span>}
      </button>
      {open && <div style={styles.body}>{children}</div>}
    </div>
  );
}

const styles = {
  section: {
    marginBottom: '22px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '6px 8px 10px 4px',
    marginLeft: '-4px',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--border)',
    borderRadius: '6px',
    marginBottom: '10px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    color: 'inherit',
  },
  chevron: {
    color: 'var(--text-faint)',
    transition: 'transform 0.15s ease',
    flexShrink: 0,
    display: 'flex',
  },
  title: {
    fontSize: '13.5px',
    fontWeight: '700' as const,
    color: 'var(--text-muted)',
    flex: 1,
  },
  count: {
    fontSize: '11.5px',
    fontWeight: '600' as const,
    color: 'var(--text-faint)',
    backgroundColor: 'var(--surface-alt)',
    borderRadius: '10px',
    padding: '1px 8px',
  },
  body: {},
};
