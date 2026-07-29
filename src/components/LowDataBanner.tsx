import { useLowData } from '../LowDataContext';

/** Fixed footer note shown whenever Low Data Mode is on. */
export function LowDataBanner() {
  const { lowData } = useLowData();
  if (!lowData) return null;

  return (
    <div style={styles.bar}>
      You are using low-data mode, and some features may not load.
    </div>
  );
}

const styles = {
  bar: {
    position: 'fixed' as const,
    left: 0,
    right: 0,
    bottom: 0,
    padding: '6px 12px',
    textAlign: 'center' as const,
    fontSize: '12px',
    color: 'var(--text-muted)',
    backgroundColor: 'var(--surface-alt)',
    borderTop: '1px solid var(--border)',
    zIndex: 499,
  },
};
