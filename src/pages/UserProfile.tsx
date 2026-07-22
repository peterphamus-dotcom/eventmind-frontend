import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useToast } from '../Toast';
import { api, photoSrc } from '../api';
import { Modal } from '../components/Modal';
import { DetailPage, styles as detail } from '../components/DetailPage';
import type { PublicUserProfile, UserReportReason } from '../types';

const REASONS: { value: UserReportReason; label: string }[] = [
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate content' },
  { value: 'SAFETY_CONCERN', label: 'Safety concern' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'OTHER', label: 'Other' },
];

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
  const showToast = useToast();

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reason, setReason] = useState<UserReportReason>('HARASSMENT');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

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

  async function handleSubmitReport() {
    if (!userId || isSubmitting) return;
    setIsSubmitting(true);
    setReportError(null);
    try {
      await api.createUserReport({ reportedUserId: userId, reason, details: details.trim() || undefined });
      setIsReportOpen(false);
      setReason('HARASSMENT');
      setDetails('');
      showToast('Report submitted');
    } catch (err: any) {
      setReportError(err.response?.data?.error || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
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

        <button onClick={() => setIsReportOpen(true)} style={styles.reportBtn}>
          {FlagIcon}
          Report user
        </button>
      </DetailPage>

      {isReportOpen && (
        <Modal title={`Report ${profile.name}`} onClose={() => setIsReportOpen(false)}>
          {reportError && <div style={styles.error}>{reportError}</div>}

          <div style={styles.section}>
            <label style={styles.label}>Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as UserReportReason)}
              style={styles.select}
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Details (optional)</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              style={styles.textarea}
              maxLength={1000}
              rows={4}
              placeholder="What happened?"
            />
            <div style={styles.charCount}>{details.length}/1000</div>
          </div>

          <button onClick={handleSubmitReport} style={styles.primaryBtn} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : 'Submit report'}
          </button>
        </Modal>
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
  reportBtn: {
    width: '100%',
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
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '8px',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    fontSize: '14px',
    boxSizing: 'border-box',
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
  charCount: {
    fontSize: '11px',
    color: 'var(--text-faint)',
    textAlign: 'right',
    marginTop: '4px',
  },
  primaryBtn: {
    width: '100%',
    padding: '10px 20px',
    backgroundColor: 'var(--danger)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
};
