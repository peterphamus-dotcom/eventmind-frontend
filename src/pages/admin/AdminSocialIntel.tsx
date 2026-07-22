import { useState, useEffect } from 'react';
import { api } from '../../api';
import { styles as shared } from '../../components/AdminShared';
import type { SocialSighting, SocialSightingType, SocialPlatform } from '../../types';

const TrendIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-2px', marginRight: '5px' }}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const StarIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-2px', marginRight: '5px' }}>
    <polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9 12 2" />
  </svg>
);

const FireIcon = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ verticalAlign: '-1px', marginRight: '4px' }}>
    <path d="M12 2s-1 3-4 5-4 5-4 8a8 8 0 0 0 16 0c0-2-1-3-2-4 0 2-1 3-2 3 1-3-1-5-1-7-1 2-2 3-2 5-2-1-3-4-1-10z" />
  </svg>
);

const PLATFORMS: { value: SocialPlatform; label: string }[] = [
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'TWITTER', label: 'Twitter / X' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'OTHER', label: 'Other' },
];

const INFLUENCER_THRESHOLD = 10000;

function relativeTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function formatFollowers(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(count % 1000 === 0 ? 0 : 1)}k`;
  return String(count);
}

export default function AdminSocialIntel() {
  const [sightings, setSightings] = useState<SocialSighting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<SocialSightingType>('TREND');
  const [platform, setPlatform] = useState<SocialPlatform>('INSTAGRAM');
  const [url, setUrl] = useState('');
  const [handle, setHandle] = useState('');
  const [followerCount, setFollowerCount] = useState('');
  const [note, setNote] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<SocialSightingType | 'ALL'>('ALL');
  const [platformFilter, setPlatformFilter] = useState<SocialPlatform | 'ALL'>('ALL');

  useEffect(() => {
    loadSightings();
  }, [typeFilter, platformFilter]);

  async function loadSightings() {
    setIsLoading(true);
    setError(null);
    try {
      const filters: any = {};
      if (typeFilter !== 'ALL') filters.type = typeFilter;
      if (platformFilter !== 'ALL') filters.platform = platformFilter;
      const res = await api.listSocialSightings(filters);
      setSightings(res.data.data?.items || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load social sightings');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) {
      setError('A link to the post/profile is required');
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      const data: any = { type, platform, url: url.trim() };
      if (handle.trim()) data.handle = handle.trim();
      if (followerCount.trim()) data.followerCount = parseInt(followerCount, 10);
      if (note.trim()) data.note = note.trim();

      const res = await api.createSocialSighting(data);
      if (typeFilter === 'ALL' && platformFilter === 'ALL') {
        setSightings([res.data.data!, ...sightings]);
      } else {
        await loadSightings();
      }
      setUrl('');
      setHandle('');
      setFollowerCount('');
      setNote('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to log sighting');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this sighting?')) return;
    setBusyId(id);
    setError(null);
    try {
      await api.deleteSocialSighting(id);
      setSightings(sightings.filter((s) => s.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete sighting');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Social Intel</h2>
      <p style={styles.subtitle}>
        Log trending posts and high-follower accounts you spot talking about the event. This is a
        manual log — there's no live platform integration.
      </p>

      {error && <div style={styles.error}>{error}</div>}

      {/* Create Form */}
      <form onSubmit={handleCreate} style={styles.form}>
        <div style={styles.toggleRow}>
          <button
            type="button"
            onClick={() => setType('TREND')}
            style={{ ...styles.toggleBtn, ...(type === 'TREND' ? styles.toggleBtnActive : {}) }}
            disabled={isCreating}
          >
            {TrendIcon}Trend
          </button>
          <button
            type="button"
            onClick={() => setType('INFLUENCER')}
            style={{ ...styles.toggleBtn, ...(type === 'INFLUENCER' ? styles.toggleBtnActive : {}) }}
            disabled={isCreating}
          >
            {StarIcon}Influencer
          </button>
        </div>

        <div style={styles.formRow}>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
            style={styles.select}
            disabled={isCreating}
          >
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@handle (optional)"
            style={styles.input}
            disabled={isCreating}
          />
          <input
            type="number"
            min="0"
            value={followerCount}
            onChange={(e) => setFollowerCount(e.target.value)}
            placeholder="Follower count"
            style={styles.followerInput}
            disabled={isCreating}
          />
        </div>

        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Link to the post or profile *"
          style={styles.urlInput}
          disabled={isCreating}
        />

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional) — e.g. which hashtag, why it's notable..."
          style={styles.textarea}
          rows={2}
          disabled={isCreating}
        />

        <button type="submit" style={styles.btnPrimary} disabled={isCreating}>
          {isCreating ? 'Logging...' : '+ Log Sighting'}
        </button>
      </form>

      {/* Filters */}
      <div style={styles.filterRow}>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as SocialSightingType | 'ALL')}
          style={styles.select}
        >
          <option value="ALL">All types</option>
          <option value="TREND">Trends</option>
          <option value="INFLUENCER">Influencers</option>
        </select>
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value as SocialPlatform | 'ALL')}
          style={styles.select}
        >
          <option value="ALL">All platforms</option>
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      {isLoading ? (
        <p>Loading sightings...</p>
      ) : sightings.length === 0 ? (
        <p style={styles.empty}>No sightings logged yet.</p>
      ) : (
        <div style={styles.list}>
          {sightings.map((s) => (
            <div key={s.id} style={styles.sightingCard}>
              <div style={styles.sightingMain}>
                <div style={styles.sightingHeader}>
                  <span style={s.type === 'INFLUENCER' ? styles.influencerBadge : styles.trendBadge}>
                    {s.type === 'INFLUENCER' ? <>{StarIcon}Influencer</> : <>{TrendIcon}Trend</>}
                  </span>
                  <span style={styles.platformBadge}>
                    {PLATFORMS.find((p) => p.value === s.platform)?.label || s.platform}
                  </span>
                  {typeof s.followerCount === 'number' && s.followerCount >= INFLUENCER_THRESHOLD && (
                    <span style={styles.hotBadge}>
                      {FireIcon}
                      {formatFollowers(s.followerCount)}+ followers
                    </span>
                  )}
                </div>
                <a href={s.url} target="_blank" rel="noopener noreferrer" style={styles.link}>
                  {s.handle ? `@${s.handle}` : s.url}
                </a>
                {s.handle && <div style={styles.urlSub}>{s.url}</div>}
                {typeof s.followerCount === 'number' && s.followerCount < INFLUENCER_THRESHOLD && (
                  <div style={styles.followerSub}>{formatFollowers(s.followerCount)} followers</div>
                )}
                {s.note && <div style={styles.note}>{s.note}</div>}
                <div style={styles.sightingMeta}>
                  logged by {s.loggedBy.name} · {relativeTime(s.createdAt)}
                </div>
              </div>
              <button
                onClick={() => handleDelete(s.id)}
                style={styles.btnDelete}
                disabled={busyId === s.id}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  card: shared.card,
  title: shared.titleTight,
  subtitle: shared.subtitle,
  error: {
    padding: '11px 14px',
    backgroundColor: 'var(--danger-soft)',
    color: 'var(--danger-text)',
    borderRadius: '9px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '1px solid var(--border)',
  },
  toggleRow: {
    display: 'flex',
    gap: '8px',
  },
  toggleBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 16px',
    // Longhand: toggleBtnActive overrides borderColor alone, and mixing
    // that with the border shorthand makes React warn on every toggle.
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--border-strong)',
    borderRadius: '6px',
    backgroundColor: 'var(--bg)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600' as const,
  },
  toggleBtnActive: {
    backgroundColor: 'var(--accent)',
    color: 'white',
    borderColor: 'var(--accent)',
  },
  formRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  select: shared.select,
  input: {
    flex: '1 1 160px',
    padding: '9px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '8px',
    fontSize: '13.5px',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
  },
  followerInput: {
    width: '130px',
    padding: '9px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '8px',
    fontSize: '13.5px',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
  },
  urlInput: {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '8px',
    fontSize: '13.5px',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '8px',
    fontSize: '13.5px',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    boxSizing: 'border-box' as const,
  },
  btnPrimary: {
    alignSelf: 'flex-start',
    padding: '9px 18px',
    backgroundColor: 'var(--success)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600' as const,
  },
  filterRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '16px',
    flexWrap: 'wrap' as const,
  },
  list: shared.list,
  sightingCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '13px 15px',
    backgroundColor: 'var(--bg)',
    borderRadius: '9px',
    border: '1px solid var(--border)',
    flexWrap: 'wrap' as const,
  },
  sightingMain: {
    flex: 1,
    minWidth: '200px',
  },
  sightingHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
    flexWrap: 'wrap' as const,
  },
  trendBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    backgroundColor: 'var(--accent-soft)',
    color: 'var(--accent-text)',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '700' as const,
  },
  influencerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    backgroundColor: 'var(--warning-soft)',
    color: 'var(--warning-text-on)',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '700' as const,
  },
  platformBadge: {
    padding: '2px 8px',
    backgroundColor: 'var(--border)',
    color: 'var(--text-muted)',
    borderRadius: '10px',
    fontSize: '10.5px',
    fontWeight: '600' as const,
  },
  hotBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    backgroundColor: 'var(--danger)',
    color: 'white',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '700' as const,
  },
  link: {
    display: 'block',
    fontSize: '13.5px',
    fontWeight: '600' as const,
    color: 'var(--accent)',
    textDecoration: 'none',
    wordBreak: 'break-all' as const,
  },
  urlSub: {
    fontSize: '11px',
    color: 'var(--text-faint)',
    wordBreak: 'break-all' as const,
    marginTop: '2px',
  },
  followerSub: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  note: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginTop: '4px',
  },
  sightingMeta: {
    fontSize: '11.5px',
    color: 'var(--text-faint)',
    marginTop: '6px',
  },
  btnDelete: {
    ...shared.btnDanger,
    flexShrink: 0,
  },
  empty: shared.empty,
};
