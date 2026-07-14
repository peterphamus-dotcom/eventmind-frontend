import { useState } from 'react';
import type { Comment } from '../types';

interface CommentsSectionProps {
  initialComments: Comment[];
  /** Persist a new comment and return the created record */
  onAdd: (text: string) => Promise<Comment>;
}

export function CommentsSection({ initialComments, onAdd }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await onAdd(text.trim());
      setComments((prev) => [...prev, created]);
      setText('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={styles.section}>
      <h3 style={styles.title}>Comments ({comments.length})</h3>

      {comments.length === 0 ? (
        <p style={styles.empty}>No comments yet. Be the first to add one.</p>
      ) : (
        <div style={styles.list}>
          {comments.map((c) => (
            <div key={c.id} style={styles.comment}>
              <div style={styles.commentHeader}>
                <span style={styles.author}>{c.author.name}</span>
                <span style={styles.date}>{new Date(c.createdAt).toLocaleString()}</span>
              </div>
              <p style={styles.text}>{c.text}</p>
            </div>
          ))}
        </div>
      )}

      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          style={styles.textarea}
          rows={3}
          disabled={isSubmitting}
        />
        <button
          type="submit"
          style={styles.submitBtn}
          disabled={isSubmitting || !text.trim()}
        >
          {isSubmitting ? 'Posting…' : 'Post Comment'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  section: {
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid #eee',
  },
  title: {
    fontSize: '16px',
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: '16px',
  },
  empty: {
    fontSize: '14px',
    color: '#999',
    fontStyle: 'italic',
    marginBottom: '16px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    marginBottom: '16px',
  },
  comment: {
    backgroundColor: '#f9f9f9',
    borderRadius: '6px',
    padding: '12px 14px',
  },
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '8px',
    marginBottom: '6px',
    flexWrap: 'wrap' as const,
  },
  author: {
    fontSize: '13px',
    fontWeight: '600' as const,
    color: '#333',
  },
  date: {
    fontSize: '12px',
    color: '#999',
  },
  text: {
    fontSize: '14px',
    color: '#333',
    margin: 0,
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
  },
  error: {
    padding: '10px 12px',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '4px',
    fontSize: '13px',
    marginBottom: '12px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    alignItems: 'flex-start',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
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
  },
};
