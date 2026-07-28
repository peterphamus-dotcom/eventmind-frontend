import { useEffect, useState } from 'react';
import { api, photoSrc } from '../api';
import { useToast } from '../Toast';
import { UserLink } from './UserLink';
import type { ProfileComment } from '../types';

interface ProfileCommentsSectionProps {
  userId: string;
  commentsEnabled: boolean;
}

/** A lightweight comment "wall" on a profile page — used by both UserProfile.tsx and Profile.tsx. */
export function ProfileCommentsSection({ userId, commentsEnabled }: ProfileCommentsSectionProps) {
  const showToast = useToast();
  const [comments, setComments] = useState<ProfileComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    api
      .listProfileComments(userId)
      .then((res) => {
        if (!cancelled) setComments(res.data.data || []);
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function handleSubmit() {
    if (isSubmitting || !text.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await api.createProfileComment(userId, text.trim());
      setComments((prev) => [...prev, res.data.data!]);
      setText('');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleHide(commentId: string) {
    if (busyId) return;
    setBusyId(commentId);
    try {
      const res = await api.hideProfileComment(commentId);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, isHidden: res.data.data!.isHidden } : c))
      );
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update comment');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(commentId: string) {
    if (busyId) return;
    setBusyId(commentId);
    try {
      await api.deleteProfileComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to delete comment');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={styles.section}>
      <label style={styles.label}>Comments</label>

      {isLoading ? (
        <p style={styles.empty}>Loading…</p>
      ) : comments.length === 0 ? (
        <p style={styles.empty}>No comments yet.</p>
      ) : (
        <div style={styles.list}>
          {comments.map((c) => (
            <div key={c.id} style={styles.row}>
              <div style={styles.avatarWrap}>
                {c.author.avatarUrl ? (
                  <img src={photoSrc(c.author.avatarUrl)} alt="" style={styles.avatarImg} />
                ) : (
                  <div style={styles.avatarPlaceholder}>{c.author.name.slice(0, 1).toUpperCase()}</div>
                )}
              </div>
              <div style={styles.rowBody}>
                <div style={styles.rowHeader}>
                  <UserLink id={c.author.id} name={c.author.name} style={styles.authorName} />
                  <span style={styles.timestamp}>{new Date(c.createdAt).toLocaleString()}</span>
                  {c.isHidden && <span style={styles.hiddenTag}>hidden</span>}
                </div>
                <p style={styles.commentText}>{c.text}</p>
                {(c.canHide || c.canManage) && (
                  <div style={styles.rowActions}>
                    {c.canHide && (
                      <button onClick={() => handleHide(c.id)} style={styles.actionLink} disabled={busyId === c.id}>
                        {c.isHidden ? 'Unhide' : 'Hide'}
                      </button>
                    )}
                    {c.canManage && (
                      <button onClick={() => handleDelete(c.id)} style={styles.actionLinkDanger} disabled={busyId === c.id}>
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {commentsEnabled && (
        <div style={styles.composer}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={styles.textarea}
            maxLength={1000}
            rows={2}
            placeholder="Leave a comment…"
          />
          <button onClick={handleSubmit} style={styles.submitBtn} disabled={isSubmitting || !text.trim()}>
            {isSubmitting ? 'Posting…' : 'Post'}
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    marginTop: '20px',
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '10px',
  },
  empty: {
    fontSize: '13px',
    color: 'var(--text-faint)',
    fontStyle: 'italic',
    margin: '0 0 14px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '14px',
  },
  row: {
    display: 'flex',
    gap: '10px',
  },
  avatarWrap: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: 'var(--bg)',
    flexShrink: 0,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--accent-text)',
    backgroundColor: 'var(--accent-soft)',
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'var(--bg)',
    borderRadius: '10px',
    padding: '9px 12px',
  },
  rowHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '3px',
    flexWrap: 'wrap',
  },
  authorName: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--text)',
  },
  timestamp: {
    fontSize: '11px',
    color: 'var(--text-faint)',
  },
  hiddenTag: {
    fontSize: '10px',
    fontWeight: 700,
    color: 'var(--danger-text)',
    backgroundColor: 'var(--danger-soft)',
    borderRadius: '8px',
    padding: '1px 7px',
    textTransform: 'uppercase',
  },
  commentText: {
    fontSize: '13.5px',
    color: 'var(--text)',
    margin: 0,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  rowActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '5px',
  },
  actionLink: {
    background: 'none',
    border: 'none',
    padding: 0,
    color: 'var(--accent)',
    fontSize: '11.5px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  actionLinkDanger: {
    background: 'none',
    border: 'none',
    padding: 0,
    color: 'var(--danger-text)',
    fontSize: '11.5px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  composer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
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
  submitBtn: {
    alignSelf: 'flex-end',
    padding: '8px 18px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
  },
};
