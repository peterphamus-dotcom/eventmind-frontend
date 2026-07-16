import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useToast } from '../Toast';
import { api, photoSrc } from '../api';
import { Modal } from '../components/Modal';
import type { PublicUserProfile, UserReportReason } from '../types';

const REASONS: { value: UserReportReason; label: string }[] = [
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate content' },
  { value: 'SAFETY_CONCERN', label: 'Safety concern' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'OTHER', label: 'Other' },
];

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

  if (isLoading) return <div style={styles.loading}>Loading...</div>;

  if (error || !profile) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button onClick={() => navigate(-1)} style={styles.backBtn}>
            ← Back
          </button>
        </div>
        <div style={styles.content}>
          <div style={styles.card}>
            <div style={styles.error}>{error || 'User not found'}</div>
          </div>
        </div>
      </div>
    );
  }

  const initials = profile.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          ← Back
        </button>
        <h1 style={styles.title}>Profile</h1>
      </div>

      <div style={styles.content}>
        <div style={styles.card}>
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
            <div style={styles.section}>
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
            🚩 Report user
          </button>
        </div>
      </div>

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
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: 'var(--bg)',
  },
  header: {
    backgroundColor: 'var(--surface)',
    padding: '20px 40px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  backBtn: {
    fontSize: '14px',
    color: '#007bff',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500' as const,
    padding: 0,
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: 0,
  },
  content: {
    maxWidth: '600px',
    margin: '40px auto',
    padding: '0 20px',
  },
  card: {
    backgroundColor: 'var(--surface)',
    borderRadius: '8px',
    padding: '32px',
    boxShadow: '0 2px 10px var(--shadow)',
  },
  error: {
    padding: '12px 16px',
    backgroundColor: 'var(--danger-bg)',
    color: 'var(--danger-text)',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '20px',
  },
  avatarSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '10px',
    marginBottom: '28px',
    paddingBottom: '28px',
    borderBottom: '1px solid var(--border)',
  },
  avatarWrap: {
    width: '96px',
    height: '96px',
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: 'var(--bg)',
    flexShrink: 0,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: '700' as const,
    color: 'var(--text-muted)',
    backgroundColor: 'var(--tag-bg)',
  },
  name: {
    fontSize: '20px',
    fontWeight: '700' as const,
    margin: 0,
    color: 'var(--text)',
  },
  roleBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: 'var(--tag-bg)',
    color: 'var(--tag-text)',
    borderRadius: '14px',
    fontSize: '12px',
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  section: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600' as const,
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '6px',
  },
  bioText: {
    fontSize: '14px',
    color: 'var(--text)',
    margin: 0,
    whiteSpace: 'pre-wrap' as const,
  },
  readOnlyValue: {
    padding: '10px 12px',
    fontSize: '14px',
    color: 'var(--text-muted)',
    backgroundColor: 'var(--bg)',
    borderRadius: '4px',
  },
  teamsList: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
  },
  teamChip: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: 'var(--tag-bg)',
    color: 'var(--tag-text)',
    borderRadius: '14px',
    fontSize: '12px',
    fontWeight: '500' as const,
  },
  divider: {
    borderTop: '1px solid var(--border)',
    margin: '8px 0 20px 0',
  },
  reportBtn: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    color: '#dc3545',
    border: '1px solid #dc3545',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600' as const,
    width: '100%',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
  },
  charCount: {
    fontSize: '11px',
    color: 'var(--text-faint)',
    textAlign: 'right' as const,
    marginTop: '4px',
  },
  primaryBtn: {
    padding: '10px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600' as const,
    width: '100%',
  },
  loading: {
    padding: '20px',
    fontSize: '16px',
    color: 'var(--text-muted)',
  },
};
