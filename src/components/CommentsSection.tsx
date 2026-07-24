import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Comment, ReactionSummary } from '../types';
import { ReactionBar } from './ReactionBar';

interface CommentsSectionProps {
  initialComments: Comment[];
  /** Persist a new comment and return the created record */
  onAdd: (text: string) => Promise<Comment>;
  /** Toggle a reaction on a comment; resolves to its fresh summary */
  onReact: (commentId: string, emoji: string) => Promise<ReactionSummary[]>;
  /** The viewer's id — used to hide the "Report" affordance on their own comments. */
  currentUserId?: string;
  /** Whether the viewer can moderate (show Hide/Unhide + the hidden badge). */
  canModerate?: boolean;
  /** Open a report flow for a comment (parent renders the reason dialog). */
  onReport?: (commentId: string) => void;
  /** Toggle a comment's hidden state; resolves to its new isHidden value. */
  onHide?: (commentId: string) => Promise<boolean>;
}

export function CommentsSection({ initialComments, onAdd, onReact, currentUserId, canModerate, onReport, onHide }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleHide(commentId: string) {
    if (!onHide) return;
    try {
      const isHidden = await onHide(commentId);
      setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, isHidden } : c)));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to hide comment');
    }
  }

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
          {comments.map((c) => {
            // The hidden badge is only ever shown to moderators. The comment's
            // own author still reaches this branch (backend returns their hidden
            // comment) but sees no badge — it looks normal to them, by design.
            const showHiddenBadge = canModerate && c.isHidden;
            const canReport = onReport && currentUserId && c.author.id !== currentUserId;
            return (
              <div key={c.id} style={{ ...styles.comment, ...(showHiddenBadge ? styles.commentHidden : {}) }}>
                <div style={styles.commentHeader}>
                  <Link to={`/users/${c.author.id}`} style={styles.author}>
                    {c.author.name}
                  </Link>
                  {showHiddenBadge && <span style={styles.hiddenBadge} title="Hidden from everyone except the author">🚫 Hidden</span>}
                  <span style={styles.date}>{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <p style={styles.text}>{c.text}</p>
                <div style={styles.reactions}>
                  <ReactionBar
                    reactions={c.reactions || []}
                    onToggle={(emoji) => onReact(c.id, emoji)}
                  />
                </div>
                {(canReport || (onHide && canModerate)) && (
                  <div style={styles.modActions}>
                    {canReport && (
                      <button type="button" onClick={() => onReport!(c.id)} style={styles.modBtn}>
                        ⚑ Report
                      </button>
                    )}
                    {onHide && canModerate && (
                      <button type="button" onClick={() => handleHide(c.id)} style={styles.modBtn}>
                        {c.isHidden ? 'Unhide' : 'Hide'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
  // Sits as the final block inside a DetailPage card, so it carries a
  // top rule instead of the bottom rule the other sections use.
  section: {
    marginTop: '22px',
    paddingTop: '22px',
    borderTop: '1px solid var(--border)',
  },
  title: {
    fontSize: '14.5px',
    fontWeight: '700' as const,
    color: 'var(--text)',
    margin: '0 0 14px',
  },
  empty: {
    fontSize: '13.5px',
    color: 'var(--text-faint)',
    fontStyle: 'italic',
    marginBottom: '16px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    marginBottom: '16px',
  },
  comment: {
    backgroundColor: 'var(--bg)',
    borderRadius: '9px',
    padding: '12px 15px',
  },
  commentHidden: {
    border: '1px dashed var(--danger-text)',
    opacity: 0.85,
  },
  hiddenBadge: {
    fontSize: '10.5px',
    fontWeight: '700' as const,
    color: 'var(--danger-text)',
    backgroundColor: 'var(--danger-soft)',
    padding: '1px 7px',
    borderRadius: '10px',
    whiteSpace: 'nowrap' as const,
  },
  modActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  },
  modBtn: {
    padding: '3px 10px',
    fontSize: '11.5px',
    fontWeight: '600' as const,
    color: 'var(--text-muted)',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-strong)',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '8px',
    marginBottom: '5px',
    flexWrap: 'wrap' as const,
  },
  author: {
    fontSize: '12.5px',
    fontWeight: '700' as const,
    color: 'var(--text)',
    textDecoration: 'none',
  },
  date: {
    fontSize: '11.5px',
    color: 'var(--text-faint)',
  },
  text: {
    fontSize: '13.5px',
    color: 'var(--text)',
    margin: 0,
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
  },
  reactions: {
    marginTop: '8px',
  },
  error: {
    padding: '11px 13px',
    backgroundColor: 'var(--danger-soft)',
    color: 'var(--danger-text)',
    borderRadius: '9px',
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
    padding: '11px 13px',
    border: '1px solid var(--border-strong)',
    borderRadius: '9px',
    fontFamily: 'inherit',
    fontSize: '14px',
    resize: 'vertical' as const,
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    boxSizing: 'border-box' as const,
  },
  submitBtn: {
    padding: '10px 20px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13.5px',
    fontWeight: '600' as const,
  },
};
