import { useState } from 'react';
import { Modal } from './Modal';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import type { ViewDensity } from '../types';

interface DisplaySettingsModalProps {
  onClose: () => void;
}

const OPTIONS: { value: ViewDensity; label: string; hint: string }[] = [
  { value: 'FULL', label: '🗂️ Full', hint: 'Thumbnails and full details on every ticket/report card.' },
  { value: 'COMPACT', label: '☰ Compact', hint: 'Condensed single-line rows — see more at a glance.' },
];

/** Lets the user pick between Full and Compact list density for the
 *  Tickets/Reports panels. Persisted server-side on the user record. */
export function DisplaySettingsModal({ onClose }: DisplaySettingsModalProps) {
  const { user, refreshUser } = useAuth();
  const [current, setCurrent] = useState<ViewDensity>(user?.viewDensity || 'FULL');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(value: ViewDensity) {
    if (value === current || isSaving) return;
    const previous = current;
    setCurrent(value);
    setIsSaving(true);
    setError(null);
    try {
      await api.updateMyProfile({ viewDensity: value });
      await refreshUser();
    } catch (err: any) {
      setCurrent(previous);
      setError(err.response?.data?.error || 'Failed to save display setting');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal title="Display Settings" onClose={onClose}>
      {error && <div style={styles.error}>{error}</div>}

      <p style={styles.intro}>Choose how Tickets and Reports lists are shown.</p>

      <div style={styles.options}>
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            disabled={isSaving}
            style={{
              ...styles.option,
              ...(current === opt.value ? styles.optionActive : {}),
            }}
          >
            <div style={styles.optionLabel}>
              {current === opt.value && '✓ '}
              {opt.label}
            </div>
            <div style={styles.optionHint}>{opt.hint}</div>
          </button>
        ))}
      </div>
    </Modal>
  );
}

const styles = {
  intro: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    margin: '0 0 16px 0',
  },
  error: {
    padding: '10px 14px',
    backgroundColor: 'var(--danger-bg)',
    color: 'var(--danger-text)',
    borderRadius: '4px',
    fontSize: '13px',
    marginBottom: '14px',
  },
  options: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  option: {
    textAlign: 'left' as const,
    padding: '14px',
    border: '1px solid var(--border-strong)',
    borderRadius: '6px',
    backgroundColor: 'var(--bg)',
    color: 'var(--text)',
    cursor: 'pointer',
  },
  optionActive: {
    borderColor: '#007bff',
    backgroundColor: 'var(--surface-hover)',
  },
  optionLabel: {
    fontSize: '14px',
    fontWeight: '600' as const,
    marginBottom: '4px',
  },
  optionHint: {
    fontSize: '12px',
    color: 'var(--text-faint)',
  },
};
