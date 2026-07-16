import { Modal } from './Modal';

interface AboutModalProps {
  onClose: () => void;
}

export function AboutModal({ onClose }: AboutModalProps) {
  return (
    <Modal title="About EventMind" onClose={onClose}>
      <p style={styles.tagline}>Live Event Intelligence Tracker</p>
      <div style={styles.row}>
        <span style={styles.label}>Version</span>
        <span style={styles.value}>v{__APP_VERSION__}</span>
      </div>
      <div style={styles.row}>
        <span style={styles.label}>Build</span>
        <span style={styles.value}>{__APP_COMMIT__}</span>
      </div>
    </Modal>
  );
}

const styles = {
  tagline: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    margin: '0 0 20px 0',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid var(--border)',
    fontSize: '14px',
  },
  label: {
    color: 'var(--text-muted)',
    fontWeight: '600' as const,
  },
  value: {
    color: 'var(--text)',
    fontFamily: 'monospace',
  },
};
