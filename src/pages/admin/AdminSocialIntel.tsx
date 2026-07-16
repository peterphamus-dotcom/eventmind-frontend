import { useState, useEffect } from 'react';
import { api } from '../../api';
import type { SocialSighting, SocialSightingType, SocialPlatform } from '../../types';

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
            📈 Trend
          </button>
          <button
            type="button"
            onClick={() => setType('INFLUENCER')}
            style={{ ...styles.toggleBtn, ...(type === 'INFLUENCER' ? styles.toggleBtnActive : {}) }}
            disabled={isCreating}
          >
            ⭐ Influencer
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
                    {s.type === 'INFLUENCER' ? '⭐ Influencer' : '📈 Trend'}
                  </span>
                  <span style={styles.platformBadge}>
                    {PLATFORMS.find((p) => p.value === s.platform)?.label || s.platform}
                  </span>
                  {typeof s.followerCount === 'number' && s.followerCount >= INFLUENCER_THRESHOLD && (
                    <span style={styles.hotBadge}>🔥 {formatFollowers(s.followerCount)}+ followers</span>
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
                ✕ Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: 'var(--surface)',
    borderRadius: '8px',
    padding: '32px',
    boxShadow: '0 2px 10px var(--shadow)',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600' as const,
    marginBottom: '4px',
    color: 'var(--text)',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text-faint)',
    marginBottom: '24px',
  },
  error: {
    padding: '12px 16px',
    backgroundColor: 'var(--danger-bg)',
    color: 'var(--danger-text)',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    marginBottom: '24px',
    paddingBottom: '24px',
    borderBottom: '1px solid var(--border)',
  },
  toggleRow: {
    display: 'flex',
    gap: '8px',
  },
  toggleBtn: {
    padding: '8px 16px',
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
  formRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  select: {
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
  },
  input: {
    flex: '1 1 160px',
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
  },
  followerInput: {
    width: '140px',
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
  },
  urlInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    boxSizing: 'border-box' as const,
  },
  btnPrimary: {
    alignSelf: 'flex-start',
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500' as const,
  },
  filterRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '16px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  sightingCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '14px 16px',
    backgroundColor: 'var(--bg)',
    borderRadius: '6px',
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
    padding: '2px 8px',
    backgroundColor: 'var(--tag-bg)',
    color: 'var(--tag-text)',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '700' as const,
  },
  influencerBadge: {
    padding: '2px 8px',
    backgroundColor: '#fff3cd',
    color: '#856404',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '700' as const,
  },
  platformBadge: {
    padding: '2px 8px',
    backgroundColor: 'var(--border)',
    color: 'var(--text-muted)',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '600' as const,
  },
  hotBadge: {
    padding: '2px 8px',
    backgroundColor: '#dc3545',
    color: 'white',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '700' as const,
  },
  link: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600' as const,
    color: '#007bff',
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
    fontSize: '13px',
    color: 'var(--text)',
    marginTop: '6px',
  },
  sightingMeta: {
    fontSize: '12px',
    color: 'var(--text-faint)',
    marginTop: '6px',
  },
  btnDelete: {
    padding: '6px 10px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500' as const,
    flexShrink: 0,
  },
  empty: {
    fontSize: '14px',
    color: 'var(--text-faint)',
    fontStyle: 'italic',
  },
};
