import { useState } from 'react';
import { useToast } from '../Toast';
import { api } from '../api';
import { Modal } from './Modal';
import type { UserReportReason } from '../types';

const REASONS: { value: UserReportReason; label: string }[] = [
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate content' },
  { value: 'SAFETY_CONCERN', label: 'Safety concern' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'OTHER', label: 'Other' },
];

interface ReportUserDialogProps {
  targetUserId: string;
  targetName: string;
  onClose: () => void;
}

/** Shared "Report user" form — used by both UserProfile.tsx and the UserProfileCard popover. */
export function ReportUserDialog({ targetUserId, targetName, onClose }: ReportUserDialogProps) {
  const showToast = useToast();
  const [reason, setReason] = useState<UserReportReason>('HARASSMENT');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await api.createUserReport({ reportedUserId: targetUserId, reason, details: details.trim() || undefined });
      showToast('Report submitted');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={`Report ${targetName}`} onClose={onClose}>
      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.section}>
        <label style={styles.label}>Reason</label>
        <select value={reason} onChange={(e) => setReason(e.target.value as UserReportReason)} style={styles.select}>
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Details (optional)</label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          style={styles.textarea}
          maxLength={1000}
          rows={4}
          placeholder="What happened?"
        />
        <div style={styles.charCount}>{details.length}/1000</div>
      </div>

      <button onClick={handleSubmit} style={styles.primaryBtn} disabled={isSubmitting}>
        {isSubmitting ? 'Submitting…' : 'Submit report'}
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
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '8px',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    fontSize: '14px',
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
    backgroundColor: 'var(--danger)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
};
