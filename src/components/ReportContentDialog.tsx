import { useState } from 'react';
import { Modal } from './Modal';
import type { UserReportReason } from '../types';

const REASONS: { value: UserReportReason; label: string }[] = [
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate content' },
  { value: 'SAFETY_CONCERN', label: 'Safety concern' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'OTHER', label: 'Other' },
];

interface Props {
  /** What's being reported, for the dialog heading (e.g. "post" or "comment"). */
  what: string;
  onSubmit: (reason: UserReportReason, details: string) => Promise<void>;
  onClose: () => void;
}

/** A small reason-picker dialog for flagging a community post or comment to moderators. */
export function ReportContentDialog({ what, onSubmit, onClose }: Props) {
  const [reason, setReason] = useState<UserReportReason>('INAPPROPRIATE_CONTENT');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(reason, details.trim());
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit report');
      setSubmitting(false);
    }
  }

  return (
    <Modal title={`Report ${what}`} onClose={onClose}>
      {error && <div style={styles.error}>{error}</div>}
      <p style={styles.blurb}>This {what} will be sent to the event moderators for review.</p>

      <div style={styles.section}>
        <label style={styles.label}>Reason</label>
        <div style={styles.reasons}>
          {REASONS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setReason(r.value)}
              style={{ ...styles.reasonChip, ...(reason === r.value ? styles.reasonChipActive : {}) }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Details (optional)</label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          style={styles.textarea}
          rows={3}
          maxLength={1000}
          placeholder="Add any context for the moderators…"
        />
      </div>

      <button type="button" onClick={submit} style={styles.submitBtn} disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit report'}
      </button>
    </Modal>
  );
}

const styles: Record<string, React.CSSProperties> = {
  error: { padding: '11px 13px', backgroundColor: 'var(--danger-soft)', color: 'var(--danger-text)', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' },
  blurb: { fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px' },
  section: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' },
  reasons: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  reasonChip: { padding: '7px 13px', borderRadius: '16px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600 },
  reasonChipActive: { backgroundColor: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent-text)' },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid var(--border-strong)', borderRadius: '4px', backgroundColor: 'var(--input-bg)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' },
  submitBtn: { padding: '10px 20px', backgroundColor: 'var(--danger-text)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, width: '100%' },
};
