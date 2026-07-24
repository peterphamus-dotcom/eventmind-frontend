import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useToast } from '../Toast';
import { api } from '../api';
import { Modal } from './Modal';
import { CommentsSection } from './CommentsSection';
import { ReactionBar } from './ReactionBar';
import { ReportContentDialog } from './ReportContentDialog';
import type { CommunityPost, UserReportReason } from '../types';

/** What's being reported: the post itself, or one of its comments. */
type ReportTarget = { kind: 'post' } | { kind: 'comment'; commentId: string };

const TYPE_META: Record<string, { label: string; color: string }> = {
  MEETUP: { label: 'Meetup', color: 'var(--accent)' },
  PROMO: { label: 'Promo', color: 'var(--warning)' },
  DISCUSSION: { label: 'Discussion', color: 'var(--purple)' },
};

function formatRange(startIso: string | null, endIso: string | null): string {
  if (!startIso) return '';
  const start = new Date(startIso);
  const startStr = start.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  if (!endIso) return startStr;
  const end = new Date(endIso);
  const sameDay = start.toDateString() === end.toDateString();
  const endStr = end.toLocaleString(undefined, sameDay ? { hour: 'numeric', minute: '2-digit' } : { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  return `${startStr} – ${endStr}`;
}

interface Props {
  postId: string;
  onClose: () => void;
  /** Called after a mutation that changes list-visible state (rsvp/follow/delete). */
  onChanged?: () => void;
}

/** Click-to-preview detail for a community post, in a modal. */
export function CommunityPostModal({ postId, onClose, onChanged }: Props) {
  const { user } = useAuth();
  const showToast = useToast();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getCommunityPost(postId)
      .then((res) => { if (!cancelled) setPost(res.data.data || null); })
      .catch((err: any) => { if (!cancelled) setError(err.response?.data?.error || 'Failed to load post'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [postId]);

  async function toggleRsvp() {
    if (!post || busy) return;
    setBusy(true);
    try {
      const res = await api.toggleCommunityRsvp(post.id);
      setPost({ ...post, myRsvp: res.data.data!.going, rsvpCount: res.data.data!.rsvpCount });
      onChanged?.();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to RSVP');
    } finally {
      setBusy(false);
    }
  }

  async function toggleFollow() {
    if (!post || busy) return;
    setBusy(true);
    try {
      const res = await api.toggleCommunityFollow(post.author.id);
      setPost({ ...post, isFollowingAuthor: res.data.data!.following });
      showToast(res.data.data!.following ? `Following ${post.author.name}` : 'Unfollowed');
      onChanged?.();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to follow');
    } finally {
      setBusy(false);
    }
  }

  async function deletePost() {
    if (!post) return;
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try {
      await api.deleteCommunityPost(post.id);
      showToast('Post deleted');
      onChanged?.();
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to delete');
    }
  }

  async function submitReport(reason: UserReportReason, details: string) {
    if (!post || !reportTarget) return;
    if (reportTarget.kind === 'post') {
      await api.reportCommunityPost(post.id, reason, details);
    } else {
      await api.reportCommunityComment(post.id, reportTarget.commentId, reason, details);
    }
    setReportTarget(null);
    showToast('Report sent to moderators');
  }

  const isExpo = user?.role === 'EXPO';
  // Expo AND admin/core can comment and react; RSVP + follow stay Expo-only.
  const canParticipate = isExpo || user?.role === 'ADMIN' || user?.role === 'CORE_TEAM';
  const meta = post ? TYPE_META[post.type] : null;

  async function togglePin() {
    if (!post || busy) return;
    setBusy(true);
    try {
      const res = await api.toggleCommunityPin(post.id);
      setPost({ ...post, isPinned: res.data.data!.isPinned });
      showToast(res.data.data!.isPinned ? 'Pinned to top' : 'Unpinned');
      onChanged?.();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to pin');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={post?.title || 'Post'} onClose={onClose}>
      {loading && <p style={styles.muted}>Loading…</p>}
      {error && <div style={styles.error}>{error}</div>}

      {post && (
        <>
          <div style={styles.topRow}>
            {post.isPinned && <span style={styles.pinnedBadge}>📌 Pinned</span>}
            {meta && <span style={{ ...styles.typeBadge, backgroundColor: meta.color }}>{meta.label}</span>}
            <span style={styles.byline}>by {post.author.name}</span>
            {isExpo && post.author.id !== user?.id && (
              <button onClick={toggleFollow} disabled={busy} style={{ ...styles.followBtn, ...(post.isFollowingAuthor ? styles.followingBtn : {}) }}>
                {post.isFollowingAuthor ? 'Following' : '+ Follow'}
              </button>
            )}
          </div>

          {post.type === 'MEETUP' && post.startTime && (
            <div style={styles.meetupMeta}>
              🗓️ {formatRange(post.startTime, post.endTime)}
              {post.meetupLocation && <> · 📍 {post.meetupLocation}</>}
            </div>
          )}

          <p style={styles.body}>{post.body}</p>

          {post.author.contact && (
            <div style={styles.contactCard}>
              <div style={styles.contactTitle}>📇 Contact {post.author.name}</div>
              <div style={styles.contactLine}>✉️ {post.author.contact.email}</div>
              {post.author.contact.handle && <div style={styles.contactLine}>🔗 {post.author.contact.handle}</div>}
              {post.author.contact.booth && <div style={styles.contactLine}>🏷️ Booth {post.author.contact.booth}</div>}
            </div>
          )}

          {post.type === 'MEETUP' && (
            <div style={styles.rsvpRow}>
              {isExpo && (
                <button onClick={toggleRsvp} disabled={busy} style={{ ...styles.rsvpBtn, ...(post.myRsvp ? styles.rsvpBtnActive : {}) }}>
                  {post.myRsvp ? "✓ You're going" : "I'm going"}
                </button>
              )}
              <span style={styles.rsvpCount}>{post.rsvpCount || 0} going</span>
              {!!post.attendees?.length && (
                <span style={styles.attendees}>· {post.attendees.map((a) => a.name).join(', ')}</span>
              )}
            </div>
          )}

          {canParticipate && (
            <div style={styles.reactRow}>
              <ReactionBar
                reactions={post.reactions || []}
                onToggle={async (emoji) => {
                  const res = await api.toggleCommunityPostReaction(post.id, emoji);
                  return res.data.data!.reactions;
                }}
              />
            </div>
          )}

          {(post.canManage || post.canModerate) && (
            <div style={styles.manageRow}>
              {post.canModerate && (
                <button onClick={togglePin} disabled={busy} style={styles.pinBtn}>
                  {post.isPinned ? 'Unpin' : '📌 Pin to top'}
                </button>
              )}
              <button onClick={deletePost} style={styles.deleteBtn}>
                {post.canManage ? 'Delete' : 'Delete (moderate)'}
              </button>
            </div>
          )}

          {post.canReport && (
            <div style={styles.manageRow}>
              <button onClick={() => setReportTarget({ kind: 'post' })} style={styles.reportBtn}>
                ⚑ Report post
              </button>
            </div>
          )}

          <div style={styles.divider} />

          {canParticipate ? (
            <CommentsSection
              initialComments={post.comments || []}
              currentUserId={user?.id}
              canModerate={post.canModerate}
              onReport={(commentId) => setReportTarget({ kind: 'comment', commentId })}
              onHide={async (commentId) => {
                const res = await api.toggleCommunityCommentHide(post.id, commentId);
                return res.data.data!.isHidden;
              }}
              onAdd={async (text) => {
                const res = await api.addCommunityComment(post.id, text);
                return res.data.data!;
              }}
              onReact={async (commentId, emoji) => {
                const res = await api.toggleCommunityCommentReaction(post.id, commentId, emoji);
                return res.data.data!.reactions;
              }}
            />
          ) : (
            <div>
              <h3 style={styles.commentsTitle}>Comments ({post.comments?.length || 0})</h3>
              {(post.comments || []).map((c) => (
                <div key={c.id} style={styles.readComment}>
                  <span style={styles.readAuthor}>{c.author.name}</span> {c.text}
                  {post.canModerate && (
                    <button
                      onClick={async () => {
                        if (!confirm('Delete this comment?')) return;
                        await api.deleteCommunityComment(post.id, c.id);
                        setPost({ ...post, comments: post.comments?.filter((x) => x.id !== c.id) });
                      }}
                      style={styles.modDelete}
                    >
                      remove
                    </button>
                  )}
                </div>
              ))}
              {!post.comments?.length && <p style={styles.muted}>No comments yet.</p>}
            </div>
          )}
        </>
      )}

      {reportTarget && (
        <ReportContentDialog
          what={reportTarget.kind === 'post' ? 'post' : 'comment'}
          onSubmit={submitReport}
          onClose={() => setReportTarget(null)}
        />
      )}
    </Modal>
  );
}

const styles: Record<string, React.CSSProperties> = {
  muted: { color: 'var(--text-muted)', fontSize: '14px' },
  error: { padding: '12px 16px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', borderRadius: '4px', fontSize: '14px', marginBottom: '16px' },
  topRow: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' },
  typeBadge: { color: 'white', fontSize: '11px', fontWeight: 700, padding: '2px 9px', borderRadius: '10px' },
  pinnedBadge: { fontSize: '11px', fontWeight: 700, color: 'var(--warning-text2)', whiteSpace: 'nowrap' },
  byline: { fontSize: '13px', color: 'var(--text-muted)' },
  followBtn: { padding: '4px 12px', borderRadius: '14px', border: '1px solid var(--accent)', backgroundColor: 'transparent', color: 'var(--accent)', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600 },
  followingBtn: { backgroundColor: 'var(--accent-soft)' },
  meetupMeta: { fontSize: '13.5px', color: 'var(--text)', fontWeight: 600, marginBottom: '12px' },
  body: { fontSize: '14.5px', lineHeight: 1.6, color: 'var(--text)', whiteSpace: 'pre-wrap', margin: '0 0 16px' },
  contactCard: { border: '1px solid var(--border-strong)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', backgroundColor: 'var(--surface-alt)' },
  contactTitle: { fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' },
  contactLine: { fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 },
  rsvpRow: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' },
  rsvpBtn: { padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--accent)', backgroundColor: 'transparent', color: 'var(--accent)', cursor: 'pointer', fontSize: '13.5px', fontWeight: 600 },
  rsvpBtnActive: { backgroundColor: 'var(--accent)', color: 'white' },
  rsvpCount: { fontSize: '13px', fontWeight: 600, color: 'var(--text)' },
  attendees: { fontSize: '12.5px', color: 'var(--text-muted)' },
  reactRow: { marginBottom: '14px' },
  manageRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' },
  pinBtn: { padding: '6px 12px', backgroundColor: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--text)', borderRadius: '6px', cursor: 'pointer', fontSize: '12.5px', fontWeight: 500 },
  deleteBtn: { padding: '6px 12px', backgroundColor: 'transparent', border: '1px solid #dc3545', color: '#dc3545', borderRadius: '6px', cursor: 'pointer', fontSize: '12.5px', fontWeight: 500 },
  reportBtn: { padding: '6px 12px', backgroundColor: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--text-muted)', borderRadius: '6px', cursor: 'pointer', fontSize: '12.5px', fontWeight: 500 },
  divider: { borderTop: '1px solid var(--border)', margin: '6px 0 16px' },
  commentsTitle: { fontSize: '14px', fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' },
  readComment: { fontSize: '13.5px', color: 'var(--text)', padding: '6px 0', lineHeight: 1.5 },
  readAuthor: { fontWeight: 700 },
  modDelete: { marginLeft: '8px', fontSize: '11px', color: '#dc3545', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' },
};
