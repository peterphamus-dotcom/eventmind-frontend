import { useState } from 'react';
import { Modal } from './Modal';
import { api } from '../api';
import { useToast } from '../Toast';

type FeedbackType = 'FEATURE' | 'ISSUE';

interface FeedbackModalProps {
  onClose: () => void;
}

const MAX_LENGTH = 2000;

export function FeedbackModal({ onClose }: FeedbackModalProps) {
  const showToast = useToast();
  const [type, setType] = useState<FeedbackType>('FEATURE');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await api.submitFeedback(type, message.trim());
      showToast(type === 'FEATURE' ? 'Thanks for the suggestion!' : 'Thanks for the report!');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Feedback" onClose={onClose}>
      <div style={styles.toggleRow}>
        <button
          type="button"
          onClick={() => setType('FEATURE')}
          style={{ ...styles.toggleBtn, ...(type === 'FEATURE' ? styles.toggleBtnActive : {}) }}
        >
          💡 Suggest a Feature
        </button>
        <button
          type="button"
          onClick={() => setType('ISSUE')}
          style={{ ...styles.toggleBtn, ...(type === 'ISSUE' ? styles.toggleBtnActive : {}) }}
        >
          🐛 Report an Issue
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            type === 'FEATURE'
              ? 'What would make EventMind more useful for you?'
              : 'What went wrong? Include steps to reproduce if you can.'
          }
          style={styles.textarea}
          rows={6}
          maxLength={MAX_LENGTH}
          disabled={isSubmitting}
          autoFocus
        />
        <div style={styles.charCount}>
          {message.length}/{MAX_LENGTH}
        </div>
        <button type="submit" style={styles.submitBtn} disabled={isSubmitting || !message.trim()}>
          {isSubmitting ? 'Sending…' : 'Send'}
        </button>
      </form>
    </Modal>
  );
}

const styles = {
  toggleRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  toggleBtn: {
    flex: 1,
    padding: '10px 8px',
    border: '1px solid var(--border-strong)',
    borderRadius: '6px',
    backgroundColor: 'var(--bg)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600' as const,
  },
  toggleBtnActive: {
    backgroundColor: '#007bff',
    color: 'white',
    borderColor: '#007bff',
  },
  error: {
    padding: '10px 14px',
    backgroundColor: 'var(--danger-bg)',
    color: 'var(--danger-text)',
    borderRadius: '4px',
    fontSize: '13px',
    marginBottom: '14px',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
  },
  charCount: {
    fontSize: '11px',
    color: 'var(--text-faint)',
    textAlign: 'right' as const,
    margin: '4px 0 14px 0',
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
