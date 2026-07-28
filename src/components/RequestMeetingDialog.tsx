import { useState } from 'react';
import { useToast } from '../Toast';
import { api } from '../api';
import { Modal } from './Modal';

interface RequestMeetingDialogProps {
  targetUserId: string;
  targetName: string;
  onClose: () => void;
}

/** Structured "let's meet" ask — proposed time + optional note, sent to a specific user. */
export function RequestMeetingDialog({ targetUserId, targetName, onClose }: RequestMeetingDialogProps) {
  const showToast = useToast();
  const [proposedTime, setProposedTime] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (isSubmitting) return;
    if (!proposedTime) {
      setError('Pick a proposed date and time');
      return;
    }
    const parsed = new Date(proposedTime);
    if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
      setError('Proposed time must be in the future');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await api.createMeetingRequest({
        recipientId: targetUserId,
        proposedTime: parsed.toISOString(),
        note: note.trim() || undefined,
      });
      showToast('Meeting request sent');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send meeting request');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={`Request a meeting with ${targetName}`} onClose={onClose}>
      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.section}>
        <label style={styles.label}>Proposed date & time</label>
        <input
          type="datetime-local"
          value={proposedTime}
          onChange={(e) => setProposedTime(e.target.value)}
          style={styles.input}
        />
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={styles.textarea}
          maxLength={500}
          rows={3}
          placeholder="What would you like to discuss?"
        />
        <div style={styles.charCount}>{note.length}/500</div>
      </div>

      <button onClick={handleSubmit} style={styles.primaryBtn} disabled={isSubmitting}>
        {isSubmitting ? 'Sending…' : 'Send meeting request'}
      </button>
    </Modal>
  );
}

const styles: Record<string, React.CSSProperties> = {
  error: {
    padding: '12px 16px',
    backgroundColor: 'var(--danger-soft)',
    color: 'var(--danger-text)',
    borderRadius: '9px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  section: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '7px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '8px',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '8px',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  charCount: {
    fontSize: '11px',
    color: 'var(--text-faint)',
    textAlign: 'right',
    marginTop: '4px',
  },
  primaryBtn: {
    width: '100%',
    padding: '10px 20px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
};
