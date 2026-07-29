import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, photoSrc } from '../api';
import { Modal } from './Modal';
import { LazyImage } from './LazyImage';
import { ReportUserDialog } from './ReportUserDialog';
import { RequestMeetingDialog } from './RequestMeetingDialog';
import { useUserProfileActions } from '../useUserProfileActions';
import type { PublicUserProfile } from '../types';

interface UserProfileCardProps {
  userId: string;
  /** Shown immediately while the full profile loads. */
  name: string;
  onClose: () => void;
}

const BIO_PREVIEW_LIMIT = 140;

function truncateBio(bio: string): string {
  if (bio.length <= BIO_PREVIEW_LIMIT) return bio;
  return bio.slice(0, BIO_PREVIEW_LIMIT).trimEnd() + '…';
}

/** Popover that pops open on a username click — quick Message/Follow/Report actions without navigating away. */
export function UserProfileCard({ userId, name, onClose }: UserProfileCardProps) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isMeetingDialogOpen, setIsMeetingDialogOpen] = useState(false);
  const { isFollowing, isMessaging, isTogglingFollow, messageUser, toggleFollow } = useUserProfileActions(profile);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    api
      .getUserProfile(userId)
      .then((res) => {
        if (!cancelled) setProfile(res.data.data || null);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <Modal title="Profile" onClose={onClose}>
        <div style={styles.header}>
          <div style={styles.avatarWrap}>
            {profile?.avatarUrl ? (
              <LazyImage src={photoSrc(profile.avatarUrl)} alt="" style={styles.avatarImg} />
            ) : (
              <div style={styles.avatarPlaceholder}>{initials}</div>
            )}
          </div>
          <div style={styles.name}>{profile?.name || name}</div>
          {profile && <span style={styles.roleBadge}>{profile.role.replace('_', ' ')}</span>}
          {profile?.statusLine && <div style={styles.statusLine}>{truncateBio(profile.statusLine)}</div>}
        </div>

        {isLoading ? (
          <p style={styles.loading}>Loading…</p>
        ) : !profile ? (
          <p style={styles.loading}>User not found.</p>
        ) : (
          <>
            {profile.bio && <p style={styles.bioText}>{truncateBio(profile.bio)}</p>}
            {profile.goalTags && profile.goalTags.length > 0 && (
              <div style={styles.goalTags}>
                {profile.goalTags.map((tag) => (
                  <span key={tag.id} style={styles.goalTagChip}>
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
            <div style={styles.actions}>
              <button onClick={messageUser} style={styles.actionBtn} disabled={isMessaging}>
                {isMessaging ? 'Starting…' : 'Message'}
              </button>
              <button onClick={toggleFollow} style={styles.actionBtn} disabled={isTogglingFollow}>
                {isFollowing ? 'Following ✓' : 'Follow'}
              </button>
              <button onClick={() => setIsMeetingDialogOpen(true)} style={styles.actionBtn}>
                Request meeting
              </button>
              <button onClick={() => setIsReportOpen(true)} style={styles.reportBtn}>
                Report
              </button>
            </div>
            <button
              onClick={() => {
                onClose();
                navigate(`/users/${userId}`);
              }}
              style={styles.fullProfileLink}
            >
              View full profile →
            </button>
          </>
        )}
      </Modal>

      {isReportOpen && profile && (
        <ReportUserDialog targetUserId={profile.id} targetName={profile.name} onClose={() => setIsReportOpen(false)} />
      )}
      {isMeetingDialogOpen && profile && (
        <RequestMeetingDialog
          targetUserId={profile.id}
          targetName={profile.name}
          onClose={() => setIsMeetingDialogOpen(false)}
        />
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '18px',
  },
  avatarWrap: {
    width: '64px',
    height: '64px',
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
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--accent-text)',
    backgroundColor: 'var(--accent-soft)',
  },
  name: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--text)',
  },
  roleBadge: {
    display: 'inline-block',
    padding: '3px 11px',
    backgroundColor: 'var(--accent-soft)',
    color: 'var(--accent-text)',
    borderRadius: '14px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  statusLine: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  loading: {
    textAlign: 'center',
    fontSize: '13.5px',
    color: 'var(--text-faint)',
    fontStyle: 'italic',
    margin: '10px 0 20px',
  },
  bioText: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    textAlign: 'center',
    lineHeight: 1.5,
    margin: '0 0 16px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  goalTags: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '6px',
    marginBottom: '14px',
  },
  goalTagChip: {
    display: 'inline-block',
    padding: '3px 10px',
    backgroundColor: 'var(--bg)',
    color: 'var(--text-muted)',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '14px',
  },
  actionBtn: {
    flex: 1,
    padding: '9px 10px',
    backgroundColor: 'var(--surface-alt)',
    color: 'var(--text)',
    border: '1px solid var(--border-strong)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
  },
  reportBtn: {
    padding: '9px 12px',
    backgroundColor: 'transparent',
    color: 'var(--danger-text)',
    border: '1px solid var(--danger)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
  },
  fullProfileLink: {
    display: 'block',
    width: '100%',
    textAlign: 'center',
    background: 'none',
    border: 'none',
    color: 'var(--accent)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    padding: '6px 0 0',
  },
};
