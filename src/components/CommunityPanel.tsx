import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../Toast';
import { api } from '../api';
import { Modal } from './Modal';
import { CommunityPostModal } from './CommunityPostModal';
import { UserLink } from './UserLink';
import { useLowData } from '../LowDataContext';
import type { CommunityPost, CommunityPostType, CommunitySortBy, MarketplacePriceType, HelpUrgency } from '../types';

const TYPE_META: Record<CommunityPostType, { label: string; color: string; emoji: string }> = {
  MEETUP: { label: 'Meetup', color: 'var(--accent)', emoji: '🤝' },
  PROMO: { label: 'Promo', color: 'var(--warning)', emoji: '📣' },
  DISCUSSION: { label: 'Discussion', color: 'var(--purple)', emoji: '💬' },
  MARKETPLACE: { label: 'Marketplace', color: 'var(--success)', emoji: '🛍️' },
  BOOTH_HIGHLIGHT: { label: 'Booth Highlight', color: 'var(--neutral)', emoji: '🏪' },
  HELPING_HAND: { label: 'Helping Hand', color: 'var(--danger)', emoji: '🙋' },
};

const URGENCY_LABEL: Record<HelpUrgency, string> = {
  NOW: 'Now',
  TODAY: 'Today',
  THIS_WEEK: 'This week',
};

function formatPrice(priceType?: MarketplacePriceType | null, price?: number | null): string {
  if (priceType === 'FREE') return 'Free';
  if (priceType === 'MAKE_OFFER') return 'Make an offer';
  if (priceType === 'FIXED' && typeof price === 'number') return `$${(price / 100).toFixed(2)}`;
  return '';
}

type FeedFilter = 'all' | 'MEETUP' | 'PROMO' | 'DISCUSSION' | 'MARKETPLACE' | 'BOOTH_HIGHLIGHT' | 'HELPING_HAND' | 'following';

const SORT_OPTIONS: { id: CommunitySortBy; label: string }[] = [
  { id: 'date', label: 'Newest' },
  { id: 'views', label: 'Most viewed' },
  { id: 'comments', label: 'Most commented' },
];

interface ComposerState {
  type: CommunityPostType;
  title: string;
  body: string;
  startTime: string;
  endTime: string;
  meetupLocation: string;
  priceType: MarketplacePriceType | '';
  price: string;
  boothLocation: string;
  urgency: HelpUrgency | '';
}

const emptyComposer: ComposerState = {
  type: 'DISCUSSION',
  title: '',
  body: '',
  startTime: '',
  endTime: '',
  meetupLocation: '',
  priceType: '',
  price: '',
  boothLocation: '',
  urgency: '',
};

function shortWhen(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/**
 * B2B Community: any user posts meetups/promos/discussions, RSVPs, reacts,
 * comments, @mentions, and follows others. Admin/Core Team additionally
 * moderate (pin, delete, hide) on top of the same participation rights.
 */
export function CommunityPanel() {
  const showToast = useToast();
  const { lowData } = useLowData();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [canPost, setCanPost] = useState(false);
  const [canModerate, setCanModerate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [sortBy, setSortBy] = useState<CommunitySortBy>('date');
  const [openId, setOpenId] = useState<string | null>(null);

  const [composer, setComposer] = useState<ComposerState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [mentionNames, setMentionNames] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { type?: CommunityPostType; feed?: 'following'; sortBy?: CommunitySortBy; lowData?: boolean } = { sortBy };
      if (filter === 'following') params.feed = 'following';
      else if (filter !== 'all') params.type = filter;
      if (lowData) params.lowData = true;
      const res = await api.listCommunity(params);
      setPosts(res.data.data?.items || []);
      setCanPost(res.data.data?.canPost || false);
      setCanModerate(res.data.data?.canModerate || false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load community');
    } finally {
      setLoading(false);
    }
  }, [filter, sortBy, lowData]);

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
    if (composer.type === 'MARKETPLACE' && !composer.priceType) { setComposerError('Choose a price option'); return; }
    if (composer.type === 'MARKETPLACE' && composer.priceType === 'FIXED' && !composer.price.trim()) {
      setComposerError('Enter a price'); return;
    }
    if (composer.type === 'BOOTH_HIGHLIGHT' && !composer.boothLocation.trim()) {
      setComposerError('Booth/table location is required'); return;
    }
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
        priceType: composer.type === 'MARKETPLACE' ? (composer.priceType as MarketplacePriceType) : undefined,
        price:
          composer.type === 'MARKETPLACE' && composer.priceType === 'FIXED'
            ? Math.round(parseFloat(composer.price) * 100)
            : undefined,
        boothLocation: composer.type === 'BOOTH_HIGHLIGHT' ? composer.boothLocation.trim() : undefined,
        urgency: composer.type === 'HELPING_HAND' && composer.urgency ? composer.urgency : undefined,
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

  async function togglePin(e: React.MouseEvent, postId: string) {
    e.stopPropagation();
    try {
      await api.toggleCommunityPin(postId);
      load();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to pin');
    }
  }

  async function toggleResolve(e: React.MouseEvent, postId: string) {
    e.stopPropagation();
    try {
      await api.toggleCommunityResolve(postId);
      load();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update');
    }
  }

  const filters: { id: FeedFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'MEETUP', label: '🤝 Meetups' },
    { id: 'PROMO', label: '📣 Promos' },
    { id: 'DISCUSSION', label: '💬 Discussion' },
    { id: 'MARKETPLACE', label: '🛍️ Marketplace' },
    { id: 'BOOTH_HIGHLIGHT', label: '🏪 Booths' },
    { id: 'HELPING_HAND', label: '🙋 Helping Hand' },
    { id: 'following', label: '⭐ Following' },
  ];

  return (
    <div>
      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.controls}>
        <p style={styles.blurb}>
          Community — organize meetups, share updates, and talk shop with other attendees.
        </p>
        {canPost && <button onClick={() => { setComposer({ ...emptyComposer }); setComposerError(null); }} style={styles.addBtn}>+ New Post</button>}
      </div>

      <div style={styles.filterRow}>
        {filters.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{ ...styles.filterChip, ...(filter === f.id ? styles.filterChipActive : {}) }}>
            {f.label}
          </button>
        ))}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as CommunitySortBy)}
          style={styles.sortSelect}
          aria-label="Sort posts by"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.id} value={s.id}>Sort: {s.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p style={styles.muted}>Loading…</p>
      ) : posts.length === 0 ? (
        <div style={styles.empty}>
          <p>🫙 Nothing here yet.</p>
          <p style={styles.emptyHint}>
            {canPost ? 'Be the first — post a meetup, a promo, or start a discussion.' : filter === 'following' ? 'Follow some people to see their posts here.' : 'Posts will appear here.'}
          </p>
        </div>
      ) : (
        <div style={styles.list}>
          {posts.map((p) => {
            const meta = TYPE_META[p.type];
            const canResolve = (p.type === 'MARKETPLACE' || p.type === 'HELPING_HAND') && (p.canManage || canModerate);
            return (
              <div
                key={p.id}
                style={{
                  ...styles.card,
                  borderLeft: `4px solid ${meta.color}`,
                  ...(p.isPinned ? styles.cardPinned : {}),
                  ...(p.isResolved ? styles.cardResolved : {}),
                }}
                onClick={() => setOpenId(p.id)}
              >
                <div style={styles.cardHead}>
                  {p.isPinned && <span style={styles.pinnedBadge} title="Pinned">📌 Pinned</span>}
                  <span style={{ ...styles.typeBadge, backgroundColor: meta.color }}>{meta.emoji} {meta.label}</span>
                  <span style={styles.cardTitle}>{p.title}</span>
                  {canResolve && (
                    <button onClick={(e) => toggleResolve(e, p.id)} style={styles.pinBtn}>
                      {p.isResolved
                        ? p.type === 'MARKETPLACE' ? 'Reopen listing' : 'Reopen'
                        : p.type === 'MARKETPLACE' ? 'Mark as Sold' : 'Mark as Resolved'}
                    </button>
                  )}
                  {canModerate && (
                    <button onClick={(e) => togglePin(e, p.id)} style={styles.pinBtn} title={p.isPinned ? 'Unpin' : 'Pin to top'}>
                      {p.isPinned ? 'Unpin' : '📌 Pin'}
                    </button>
                  )}
                </div>
                <div style={styles.cardMeta}>
                  <span>by <UserLink id={p.author.id} name={p.author.name} /></span>
                  <span>· {shortWhen(p.createdAt)}</span>
                  {p.type === 'MEETUP' && p.startTime && <span>· 🗓️ {shortWhen(p.startTime)}{p.meetupLocation ? ` · 📍 ${p.meetupLocation}` : ''}</span>}
                  {p.type === 'MEETUP' && <span>· 👥 {p.rsvpCount || 0} going</span>}
                  {p.type === 'MARKETPLACE' && <span>· {formatPrice(p.priceType, p.price)}</span>}
                  {p.type === 'BOOTH_HIGHLIGHT' && p.boothLocation && <span>· 📍 {p.boothLocation}</span>}
                  {p.type === 'HELPING_HAND' && p.urgency && <span>· ⏱ {URGENCY_LABEL[p.urgency]}</span>}
                  {p.isResolved && <span>· ✅ {p.type === 'MARKETPLACE' ? 'Sold' : 'Resolved'}</span>}
                  {!!p.commentCount && <span>· 💬 {p.commentCount}</span>}
                  {!!p.viewCount && <span>· 👁️ {p.viewCount}</span>}
                  {p.author.contact && <span title="Shared contact">· 📇</span>}
                </div>
                {!!p.reactions?.length && (
                  <div style={styles.reactionPreview}>
                    {p.reactions.filter((r) => r.count > 0).map((r) => (
                      <span key={r.emoji} style={styles.reactionChip}>
                        {r.emoji} {r.count}
                      </span>
                    ))}
                  </div>
                )}
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
              {(['MEETUP', 'PROMO', 'DISCUSSION', 'MARKETPLACE', 'BOOTH_HIGHLIGHT', 'HELPING_HAND'] as CommunityPostType[]).map((t) => (
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

          {composer.type === 'MARKETPLACE' && (
            <>
              <div style={styles.section}>
                <label style={styles.label}>Price</label>
                <div style={styles.typePick}>
                  {(['FIXED', 'FREE', 'MAKE_OFFER'] as MarketplacePriceType[]).map((pt) => (
                    <button
                      key={pt}
                      onClick={() => setComposer({ ...composer, priceType: pt })}
                      style={{ ...styles.typeOption, ...(composer.priceType === pt ? { borderColor: 'var(--success)', color: 'var(--success)', fontWeight: 700 } : {}) }}
                    >
                      {pt === 'FIXED' ? 'Fixed price' : pt === 'FREE' ? 'Free' : 'Make an offer'}
                    </button>
                  ))}
                </div>
              </div>
              {composer.priceType === 'FIXED' && (
                <div style={styles.section}>
                  <label style={styles.label}>Amount ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={composer.price}
                    onChange={(e) => setComposer({ ...composer, price: e.target.value })}
                    style={styles.input}
                    placeholder="0.00"
                  />
                </div>
              )}
            </>
          )}

          {composer.type === 'BOOTH_HIGHLIGHT' && (
            <div style={styles.section}>
              <label style={styles.label}>Booth / table location</label>
              <input
                value={composer.boothLocation}
                onChange={(e) => setComposer({ ...composer, boothLocation: e.target.value })}
                style={styles.input}
                placeholder="e.g. Stall 12"
                maxLength={120}
              />
            </div>
          )}

          {composer.type === 'HELPING_HAND' && (
            <div style={styles.section}>
              <label style={styles.label}>Urgency (optional)</label>
              <select
                value={composer.urgency}
                onChange={(e) => setComposer({ ...composer, urgency: e.target.value as HelpUrgency | '' })}
                style={styles.input}
              >
                <option value="">No rush</option>
                <option value="NOW">Now</option>
                <option value="TODAY">Today</option>
                <option value="THIS_WEEK">This week</option>
              </select>
            </div>
          )}

          <div style={styles.section}>
            <label style={styles.label}>Body</label>
            <textarea value={composer.body} onChange={(e) => setComposer({ ...composer, body: e.target.value })} style={styles.textarea} rows={5} maxLength={5000} placeholder="Write your post… tag others with @Name" />
            {mentionNames.length > 0 && (
              <p style={styles.mentionHint}>Tip: @mention people in comments — {mentionNames.slice(0, 3).map((n) => `@${n}`).join(', ')}{mentionNames.length > 3 ? '…' : ''}</p>
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
  filterRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px', alignItems: 'center' },
  sortSelect: { marginLeft: 'auto', padding: '6px 10px', borderRadius: '16px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600 },
  filterChip: { padding: '6px 12px', borderRadius: '16px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600 },
  filterChipActive: { backgroundColor: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent-text)' },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  card: { backgroundColor: 'var(--surface)', borderRadius: '6px', boxShadow: '0 1px 4px var(--shadow)', padding: '12px 14px', cursor: 'pointer' },
  cardPinned: { backgroundColor: 'var(--warning-soft)' },
  cardResolved: { opacity: 0.55, filter: 'grayscale(0.6)' },
  pinnedBadge: { fontSize: '11px', fontWeight: 700, color: 'var(--warning-text2)', whiteSpace: 'nowrap' },
  pinBtn: { marginLeft: 'auto', padding: '3px 10px', borderRadius: '12px', border: '1px solid var(--border-strong)', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11.5px', fontWeight: 600, whiteSpace: 'nowrap' },
  cardHead: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' },
  typeBadge: { color: 'white', fontSize: '11px', fontWeight: 700, padding: '2px 9px', borderRadius: '10px', whiteSpace: 'nowrap' },
  cardTitle: { fontSize: '15px', fontWeight: 600, color: 'var(--text)' },
  cardMeta: { display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)' },
  reactionPreview: { display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '7px' },
  reactionChip: { display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--surface-alt)', fontSize: '12px', color: 'var(--text)' },
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
