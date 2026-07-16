import type { ReactNode } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Centered overlay modal — click the backdrop or the ✕ to close. */
export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>{title}</h2>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close">
            ✕
          </button>
        </div>
        <div style={styles.body}>{children}</div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '20px',
  },
  card: {
    backgroundColor: 'var(--surface)',
    borderRadius: '8px',
    boxShadow: '0 8px 30px var(--shadow)',
    width: '100%',
    maxWidth: '440px',
    maxHeight: '85vh',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 20px',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  title: {
    fontSize: '17px',
    fontWeight: '700' as const,
    color: 'var(--text)',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    padding: '4px',
    lineHeight: 1,
  },
  body: {
    padding: '20px',
  },
};
