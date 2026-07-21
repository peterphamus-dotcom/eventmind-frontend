import { useState } from 'react';
import { Modal } from './Modal';
import { api } from '../api';
import { useToast } from '../Toast';

interface InviteModalProps {
  onClose: () => void;
}

/** Any approved user can invite someone by email; the invitee sets up their
 * own account and then awaits admin approval. */
export function InviteModal({ onClose }: InviteModalProps) {
  const showToast = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.sendInvite(email.trim());
      showToast(res.data.data?.message || 'Invite sent');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send invite. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Invite someone" onClose={onClose}>
      <p style={styles.blurb}>
        Enter their email and we’ll send a link to set up an account. They’ll join the pending
        list until an admin approves them.
      </p>

      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          style={styles.input}
          disabled={isSubmitting}
          autoFocus
        />
        <button type="submit" style={styles.submitBtn} disabled={isSubmitting || !email.trim()}>
          {isSubmitting ? 'Sending…' : 'Send invite'}
        </button>
      </form>
    </Modal>
  );
}

const styles = {
  blurb: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    margin: '0 0 16px 0',
    lineHeight: 1.5,
  },
  error: {
    padding: '10px 14px',
    backgroundColor: 'var(--danger-bg)',
    color: 'var(--danger-text)',
    borderRadius: '4px',
    fontSize: '13px',
    marginBottom: '14px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
    marginBottom: '14px',
  },
  submitBtn: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600' as const,
    width: '100%',
  },
};
