import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../Toast';
import { api } from '../api';
import { Modal } from './Modal';
import { CommunityPostModal } from './CommunityPostModal';
import type { CommunityPost, CommunityPostType } from '../types';

const TYPE_META: Record<CommunityPostType, { label: string; color: string; emoji: string }> = {
  MEETUP: { label: 'Meetup', color: 'var(--accent)', emoji: '🤝' },
  PROMO: { label: 'Promo', color: 'var(--warning)', emoji: '📣' },
  DISCUSSION: { label: 'Discussion', color: 'var(--purple)', emoji: '💬' },
};

type FeedFilter = 'all' | 'MEETUP' | 'PROMO' | 'DISCUSSION' | 'following';

interface ComposerState {
  type: CommunityPostType;
  title: string;
  body: string;
  startTime: string;
  endTime: string;
  meetupLocation: string;
}

const emptyComposer: ComposerState = { type: 'DISCUSSION', title: '', body: '', startTime: '', endTime: '', meetupLocation: '' };

function shortWhen(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/**
 * B2B Community: Expo vendors post meetups/promos/discussions, RSVP, react,
 * comment, @mention, and follow each other. Admin/Core Team can view and
 * moderate but not post; Members never reach this tab.
 */
export function CommunityPanel() {
  const showToast = useToast();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [canPost, setCanPost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const [composer, setComposer] = useState<ComposerState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [mentionNames, setMentionNames] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { type?: CommunityPostType; feed?: 'following' } = {};
      if (filter === 'following') params.feed = 'following';
      else if (filter !== 'all') params.type = filter;
      const res = await api.listCommunity(params);
      setPosts(res.data.data?.items || []);
      setCanPost(res.data.data?.canPost || false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load community');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  // Deep-link from a notification: open the referenced post once, then clear it.
  useEffect(() => {
    const pending = sessionStorage.getItem('communityOpenPostId');
    if (pending) {
      sessionStorage.removeItem('communityOpenPostId');
      setOpenId(pending);
    }
  }, []);

  useEffect(() => {
    api.communityMentionCandidates()
      .then((res) => setMentionNames((res.data.data?.items || []).map((u) => u.name)))
      .catch(() => setMentionNames([]));
  }, []);

  async function submit() {
    if (!composer || submitting) return;
    if (!composer.title.trim()) { setComposerError('Title is required'); return; }
    if (!composer.body.trim()) { setComposerError('Body is required'); return; }
    if (composer.type === 'MEETUP' && !composer.startTime) { setComposerError('Meetups need a start time'); return; }
    setSubmitting(true);
    setComposerError(null);
    try {
      await api.createCommunityPost({
        type: composer.type,
        title: composer.title.trim(),
        body: composer.body.trim(),
        startTime: composer.type === 'MEETUP' && composer.startTime ? new Date(composer.startTime).toISOString() : undefined,
        endTime: composer.type === 'MEETUP' && composer.endTime ? new Date(composer.endTime).toISOString() : undefined,
        meetupLocation: composer.type === 'MEETUP' ? composer.meetupLocation.trim() || undefined : undefined,
      });
      showToast('Posted to community');
      setComposer(null);
      load();
    } catch (err: any) {
      setComposerError(err.response?.data?.error || 'Failed to post');
    } finally {
      setSubmitting(false);
    }
  }

  const filters: { id: FeedFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'MEETUP', label: '🤝 Meetups' },
    { id: 'PROMO', label: '📣 Promos' },
    { id: 'DISCUSSION', label: '💬 Discussion' },
    { id: 'following', label: '⭐ Following' },
  ];

  return (
    <div>
      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.controls}>
        <p style={styles.blurb}>
          Vendor networking — organize meetups, promote your booth, and talk shop with other Expo vendors.
        </p>
        {canPost && <button onClick={() => { setComposer({ ...emptyComposer }); setComposerError(null); }} style={styles.addBtn}>+ New Post</button>}
      </div>

      <div style={styles.filterRow}>
        {filters.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{ ...styles.filterChip, ...(filter === f.id ? styles.filterChipActive : {}) }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={styles.muted}>Loading…</p>
      ) : posts.length === 0 ? (
        <div style={styles.empty}>
          <p>🫙 Nothing here yet.</p>
          <p style={styles.emptyHint}>
            {canPost ? 'Be the first — post a meetup, a promo, or start a discussion.' : filter === 'following' ? 'Follow some vendors to see their posts here.' : 'Expo vendor posts will appear here.'}
          </p>
        </div>
      ) : (
        <div style={styles.list}>
          {posts.map((p) => {
            const meta = TYPE_META[p.type];
            return (
              <div key={p.id} style={{ ...styles.card, borderLeft: `4px solid ${meta.color}` }} onClick={() => setOpenId(p.id)}>
                <div style={styles.cardHead}>
                  <span style={{ ...styles.typeBadge, backgroundColor: meta.color }}>{meta.emoji} {meta.label}</span>
                  <span style={styles.cardTitle}>{p.title}</span>
                </div>
                <div style={styles.cardMeta}>
                  <span>by {p.author.name}</span>
                  {p.type === 'MEETUP' && p.startTime && <span>· 🗓️ {shortWhen(p.startTime)}{p.meetupLocation ? ` · 📍 ${p.meetupLocation}` : ''}</span>}
                  {p.type === 'MEETUP' && <span>· 👥 {p.rsvpCount || 0} going</span>}
                  {!!p.commentCount && <span>· 💬 {p.commentCount}</span>}
                  {p.author.contact && <span title="Shared contact">· 📇</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {openId && (
        <CommunityPostModal
          postId={openId}
          onClose={() => setOpenId(null)}
          onChanged={load}
        />
      )}

      {composer && (
        <Modal title="New Community Post" onClose={() => setComposer(null)}>
          {composerError && <div style={styles.error}>{composerError}</div>}

          <div style={styles.section}>
            <label style={styles.label}>Type</label>
            <div style={styles.typePick}>
              {(['MEETUP', 'PROMO', 'DISCUSSION'] as CommunityPostType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setComposer({ ...composer, type: t })}
                  style={{ ...styles.typeOption, ...(composer.type === t ? { borderColor: TYPE_META[t].color, color: TYPE_META[t].color, fontWeight: 700 } : {}) }}
                >
                  {TYPE_META[t].emoji} {TYPE_META[t].label}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Title</label>
            <input value={composer.title} onChange={(e) => setComposer({ ...composer, title: e.target.value })} style={styles.input} maxLength={200} />
          </div>

          {composer.type === 'MEETUP' && (
            <>
              <div style={styles.row2}>
                <div style={styles.section}>
                  <label style={styles.label}>Starts</label>
                  <input type="datetime-local" value={composer.startTime} onChange={(e) => setComposer({ ...composer, startTime: e.target.value })} style={styles.input} />
                </div>
                <div style={styles.section}>
                  <label style={styles.label}>Ends (optional)</label>
                  <input type="datetime-local" value={composer.endTime} onChange={(e) => setComposer({ ...composer, endTime: e.target.value })} style={styles.input} />
                </div>
              </div>
              <div style={styles.section}>
                <label style={styles.label}>Where (optional)</label>
                <input value={composer.meetupLocation} onChange={(e) => setComposer({ ...composer, meetupLocation: e.target.value })} style={styles.input} placeholder="e.g. Booth B12, hotel bar…" maxLength={120} />
              </div>
            </>
          )}

          <div style={styles.section}>
            <label style={styles.label}>Body</label>
            <textarea value={composer.body} onChange={(e) => setComposer({ ...composer, body: e.target.value })} style={styles.textarea} rows={5} maxLength={5000} placeholder="Write your post… tag others with @Name" />
            {mentionNames.length > 0 && (
              <p style={styles.mentionHint}>Tip: @mention vendors in comments — {mentionNames.slice(0, 3).map((n) => `@${n}`).join(', ')}{mentionNames.length > 3 ? '…' : ''}</p>
            )}
          </div>

          <button onClick={submit} style={styles.primaryBtn} disabled={submitting}>
            {submitting ? 'Posting…' : 'Post'}
          </button>
        </Modal>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  error: { padding: '12px 16px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', borderRadius: '4px', fontSize: '14px', marginBottom: '16px' },
  controls: { display: 'flex', gap: '12px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' },
  blurb: { fontSize: '13.5px', color: 'var(--text-muted)', margin: 0, flex: '1 1 260px' },
  addBtn: { padding: '10px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' },
  filterRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' },
  filterChip: { padding: '6px 12px', borderRadius: '16px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600 },
  filterChipActive: { backgroundColor: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent-text)' },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  card: { backgroundColor: 'var(--surface)', borderRadius: '6px', boxShadow: '0 1px 4px var(--shadow)', padding: '12px 14px', cursor: 'pointer' },
  cardHead: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' },
  typeBadge: { color: 'white', fontSize: '11px', fontWeight: 700, padding: '2px 9px', borderRadius: '10px', whiteSpace: 'nowrap' },
  cardTitle: { fontSize: '15px', fontWeight: 600, color: 'var(--text)' },
  cardMeta: { display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)' },
  empty: { textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' },
  emptyHint: { fontSize: '14px', color: 'var(--text-faint)', margin: '8px 0 0' },
  muted: { color: 'var(--text-muted)', fontSize: '14px' },
  section: { marginBottom: '16px', flex: 1 },
  row2: { display: 'flex', gap: '12px' },
  label: { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' },
  typePick: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  typeOption: { padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid var(--border-strong)', borderRadius: '4px', backgroundColor: 'var(--input-bg)', color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid var(--border-strong)', borderRadius: '4px', backgroundColor: 'var(--input-bg)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' },
  mentionHint: { fontSize: '11.5px', color: 'var(--text-faint)', margin: '6px 0 0' },
  primaryBtn: { padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, width: '100%' },
};
