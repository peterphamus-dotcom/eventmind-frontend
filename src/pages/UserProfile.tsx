import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api, photoSrc } from '../api';
import { DetailPage, styles as detail } from '../components/DetailPage';
import { ReportUserDialog } from '../components/ReportUserDialog';
import { useUserProfileActions } from '../useUserProfileActions';
import type { PublicUserProfile } from '../types';

const FlagIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);

export function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const { isFollowing, isMessaging, isTogglingFollow, messageUser, toggleFollow } = useUserProfileActions(profile);

  useEffect(() => {
    if (!userId) return;
    // Own profile is edited at /profile, not viewed here.
    if (currentUser && userId === currentUser.id) {
      navigate('/profile', { replace: true });
      return;
    }
    loadProfile(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, currentUser]);

  async function loadProfile(id: string) {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getUserProfile(id);
      setProfile(response.data.data || null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) return <div style={detail.loading}>Loading…</div>;

  if (error || !profile) {
    return (
      <DetailPage onBack={() => navigate(-1)} backLabel="Back" maxWidth="560px">
        <div style={styles.error}>{error || 'User not found'}</div>
      </DetailPage>
    );
  }

  const initials = profile.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <DetailPage title="Profile" onBack={() => navigate(-1)} backLabel="Back" maxWidth="560px">
        <div style={styles.avatarSection}>
          <div style={styles.avatarWrap}>
            {profile.avatarUrl ? (
              <img src={photoSrc(profile.avatarUrl)} alt="" style={styles.avatarImg} />
            ) : (
              <div style={styles.avatarPlaceholder}>{initials}</div>
            )}
          </div>
          <h2 style={styles.name}>{profile.name}</h2>
          <span style={styles.roleBadge}>{profile.role.replace('_', ' ')}</span>
        </div>

        {profile.bio && (
          <div style={styles.section}>
            <label style={styles.label}>Bio</label>
            <p style={styles.bioText}>{profile.bio}</p>
          </div>
        )}

        <div style={styles.section}>
          <label style={styles.label}>Home location</label>
          <div style={styles.readOnlyValue}>{profile.homeLocation?.name || 'Unknown'}</div>
        </div>

        {profile.teams && profile.teams.length > 0 && (
          <div style={styles.sectionTight}>
            <label style={styles.label}>Teams</label>
            <div style={styles.teamsList}>
              {profile.teams.map((team) => (
                <span key={team.id} style={styles.teamChip}>
                  {team.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={styles.divider} />

        <div style={styles.actionsRow}>
          <button onClick={messageUser} style={styles.actionBtn} disabled={isMessaging}>
            {isMessaging ? 'Starting…' : 'Message'}
          </button>
          <button onClick={toggleFollow} style={styles.actionBtn} disabled={isTogglingFollow}>
            {isFollowing ? 'Following ✓' : 'Follow'}
          </button>
          <button onClick={() => setIsReportOpen(true)} style={styles.reportBtn}>
            {FlagIcon}
            Report user
          </button>
        </div>
      </DetailPage>

      {isReportOpen && (
        <ReportUserDialog targetUserId={profile.id} targetName={profile.name} onClose={() => setIsReportOpen(false)} />
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  error: {
    padding: '12px 16px',
    backgroundColor: 'var(--danger-soft)',
    color: 'var(--danger-text)',
    borderRadius: '9px',
    fontSize: '14px',
    marginBottom: '20px',
  },
  avatarSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '26px',
    paddingBottom: '26px',
    borderBottom: '1px solid var(--border)',
  },
  avatarWrap: {
    width: '88px',
    height: '88px',
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
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--accent-text)',
    backgroundColor: 'var(--accent-soft)',
  },
  name: {
    fontSize: '19px',
    fontWeight: 700,
    margin: 0,
    color: 'var(--text)',
  },
  roleBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    backgroundColor: 'var(--accent-soft)',
    color: 'var(--accent-text)',
    borderRadius: '14px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: '20px',
  },
  sectionTight: {
    marginBottom: '8px',
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '7px',
  },
  bioText: {
    fontSize: '13.5px',
    color: 'var(--text)',
    margin: 0,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
  },
  readOnlyValue: {
    padding: '10px 13px',
    fontSize: '13.5px',
    color: 'var(--text-muted)',
    backgroundColor: 'var(--bg)',
    borderRadius: '8px',
  },
  teamsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  teamChip: {
    display: 'inline-block',
    padding: '4px 11px',
    backgroundColor: 'var(--accent-soft)',
    color: 'var(--accent-text)',
    borderRadius: '14px',
    fontSize: '12px',
    fontWeight: 600,
  },
  divider: {
    borderTop: '1px solid var(--border)',
    margin: '20px 0',
  },
  actionsRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  actionBtn: {
    flex: 1,
    minWidth: '110px',
    padding: '10px 16px',
    backgroundColor: 'var(--surface-alt)',
    color: 'var(--text)',
    border: '1px solid var(--border-strong)',
    borderRadius: '9px',
    cursor: 'pointer',
    fontSize: '13.5px',
    fontWeight: 600,
  },
  reportBtn: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    color: 'var(--danger-text)',
    border: '1px solid var(--danger)',
    borderRadius: '9px',
    cursor: 'pointer',
    fontSize: '13.5px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
  },
};
