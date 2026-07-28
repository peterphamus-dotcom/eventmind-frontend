import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { useToast } from '../Toast';
import { api, photoSrc } from '../api';
import { DetailPage, styles as detail } from '../components/DetailPage';
import { styles as form } from '../components/FormPage';
import { ProfileCommentsSection } from '../components/ProfileCommentsSection';
import type { MessagePrivacy, Tag } from '../types';

export function Profile() {
  const { user, refreshUser } = useAuth();
  const showToast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [shareContact, setShareContact] = useState(false);
  const [communityHandle, setCommunityHandle] = useState('');
  const [communityBooth, setCommunityBooth] = useState('');
  const [messagePrivacy, setMessagePrivacy] = useState<MessagePrivacy>('TEAM_ONLY');
  const [networkingBlurb, setNetworkingBlurb] = useState('');
  const [goalTagIds, setGoalTagIds] = useState<string[]>([]);
  const [availableGoalTags, setAvailableGoalTags] = useState<Tag[]>([]);
  const [statusLine, setStatusLine] = useState('');
  const [profileCommentsEnabled, setProfileCommentsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPw, setIsChangingPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setShareContact(user.shareContactInCommunity || false);
      setCommunityHandle(user.communityHandle || '');
      setCommunityBooth(user.communityBooth || '');
      setMessagePrivacy(user.messagePrivacy || 'TEAM_ONLY');
      setNetworkingBlurb(user.networkingBlurb || '');
      setGoalTagIds((user.goalTags || []).map((t) => t.id));
      setStatusLine(user.statusLine || '');
      setProfileCommentsEnabled(user.profileCommentsEnabled !== false);
    }
  }, [user]);

  useEffect(() => {
    api
      .listTags(1, 100, true)
      .then((res) => setAvailableGoalTags(res.data.data?.items || []))
      .catch(() => setAvailableGoalTags([]));
  }, []);

  if (!user) return <div style={detail.loading}>Loading…</div>;

  const isExpo = user.role === 'EXPO';
  const sameIds = (a: string[], b: string[]) =>
    a.length === b.length && [...a].sort().every((id, i) => id === [...b].sort()[i]);
  const isDirty =
    name !== user.name ||
    phone !== (user.phone || '') ||
    bio !== (user.bio || '') ||
    shareContact !== (user.shareContactInCommunity || false) ||
    communityHandle !== (user.communityHandle || '') ||
    communityBooth !== (user.communityBooth || '') ||
    messagePrivacy !== (user.messagePrivacy || 'TEAM_ONLY') ||
    networkingBlurb !== (user.networkingBlurb || '') ||
    !sameIds(goalTagIds, (user.goalTags || []).map((t) => t.id)) ||
    statusLine !== (user.statusLine || '') ||
    profileCommentsEnabled !== (user.profileCommentsEnabled !== false);

  function toggleGoalTag(id: string) {
    setGoalTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  async function handleSave() {
    if (isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      await api.updateMyProfile({
        name,
        phone,
        bio,
        messagePrivacy,
        networkingBlurb,
        goalTagIds,
        statusLine,
        profileCommentsEnabled,
        ...(isExpo ? { shareContactInCommunity: shareContact, communityHandle, communityBooth } : {}),
      });
      await refreshUser();
      showToast('Profile updated');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsUploadingAvatar(true);
    setError(null);
    try {
      await api.uploadMyAvatar(file);
      await refreshUser();
      showToast('Photo updated');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload photo');
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function handleChangePassword() {
    if (isChangingPw) return;
    setPwError(null);
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    setIsChangingPw(true);
    try {
      await api.changeMyPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password updated');
    } catch (err: any) {
      setPwError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setIsChangingPw(false);
    }
  }

  async function handleRemoveAvatar() {
    if (isUploadingAvatar) return;
    setIsUploadingAvatar(true);
    setError(null);
    try {
      await api.removeMyAvatar();
      await refreshUser();
      showToast('Photo removed');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove photo');
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <DetailPage title="My Profile" maxWidth="560px">
      {error && <div style={detail.error}>{error}</div>}

      {/* Avatar */}
      <div style={styles.avatarSection}>
        <div style={styles.avatarWrap} onClick={() => fileInputRef.current?.click()}>
          {user.avatarUrl ? (
            <img src={photoSrc(user.avatarUrl)} alt="" style={styles.avatarImg} />
          ) : (
            <div style={styles.avatarPlaceholder}>{initials}</div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handleAvatarChange}
        />
        <div style={styles.avatarActions}>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={styles.secondaryBtn}
            disabled={isUploadingAvatar}
          >
            {isUploadingAvatar ? 'Uploading…' : 'Change Photo'}
          </button>
          {user.avatarUrl && (
            <button
              onClick={handleRemoveAvatar}
              style={styles.dangerLinkBtn}
              disabled={isUploadingAvatar}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Editable fields */}
      <div style={styles.field}>
        <label style={form.uppercaseLabel}>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={form.input}
          maxLength={100}
        />
      </div>

      <div style={styles.field}>
        <label style={form.uppercaseLabel}>Email</label>
        <div style={form.readOnlyValue}>{user.email}</div>
      </div>

      <div style={styles.field}>
        <label style={form.uppercaseLabel}>Contact number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={form.input}
          placeholder="e.g. (555) 123-4567"
          maxLength={30}
        />
      </div>

      <div style={styles.field}>
        <label style={form.uppercaseLabel}>Status</label>
        <input
          type="text"
          value={statusLine}
          onChange={(e) => setStatusLine(e.target.value)}
          style={form.input}
          maxLength={140}
          placeholder="What are you up to right now?"
        />
        <div style={styles.charCount}>{statusLine.length}/140</div>
      </div>

      <div style={styles.fieldLast}>
        <label style={form.uppercaseLabel}>Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          style={{ ...form.textarea, minHeight: '76px' }}
          maxLength={500}
          rows={3}
          placeholder="Say a little about yourself…"
        />
        <div style={styles.charCount}>{bio.length}/500</div>
      </div>

      <div style={styles.communityBox}>
        <h3 style={styles.subtitle}>Direct messages</h3>
        <p style={styles.communityNote}>
          Anyone can send you a first message — this setting controls whether it lands directly in
          your inbox or in Message Requests first. Threads you're already in keep working no matter
          what you pick here.
        </p>
        <div style={styles.privacyOptions}>
          <label style={styles.toggleRow}>
            <input
              type="radio"
              name="messagePrivacy"
              checked={messagePrivacy === 'DO_NOT_DISTURB'}
              onChange={() => setMessagePrivacy('DO_NOT_DISTURB')}
            />
            <span>
              <strong>Do not disturb</strong> — no one can start a new conversation with you (existing threads still work)
            </span>
          </label>
          <label style={styles.toggleRow}>
            <input
              type="radio"
              name="messagePrivacy"
              checked={messagePrivacy === 'TEAM_ONLY'}
              onChange={() => setMessagePrivacy('TEAM_ONLY')}
            />
            <span>
              <strong>Team only</strong> — teammates land in your inbox directly, everyone else goes to Message Requests
            </span>
          </label>
          <label style={styles.toggleRow}>
            <input
              type="radio"
              name="messagePrivacy"
              checked={messagePrivacy === 'PUBLIC'}
              onChange={() => setMessagePrivacy('PUBLIC')}
            />
            <span>
              <strong>Public</strong> — anyone's first message lands directly in your inbox
            </span>
          </label>
        </div>
      </div>

      <div style={styles.communityBox}>
        <h3 style={styles.subtitle}>Networking goals</h3>
        <p style={styles.communityNote}>
          Pick what you're looking for at this event — other attendees can browse or get matched
          with you by goal in the Networking tab.
        </p>
        {availableGoalTags.length === 0 ? (
          <p style={styles.communityNote}>No goal tags have been set up yet — check back later.</p>
        ) : (
          <div style={styles.goalTagOptions}>
            {availableGoalTags.map((tag) => (
              <label key={tag.id} style={styles.goalTagOption}>
                <input
                  type="checkbox"
                  checked={goalTagIds.includes(tag.id)}
                  onChange={() => toggleGoalTag(tag.id)}
                />
                {tag.name}
              </label>
            ))}
          </div>
        )}
        <div style={{ marginTop: '14px' }}>
          <label style={form.uppercaseLabel}>Elaborate (optional)</label>
          <textarea
            value={networkingBlurb}
            onChange={(e) => setNetworkingBlurb(e.target.value)}
            style={{ ...form.textarea, minHeight: '60px' }}
            maxLength={500}
            rows={2}
            placeholder="Anything else worth knowing about what you're looking for?"
          />
          <div style={styles.charCount}>{networkingBlurb.length}/500</div>
        </div>
      </div>

      <div style={styles.communityBox}>
        <h3 style={styles.subtitle}>Profile comments</h3>
        <label style={styles.toggleRow}>
          <input
            type="checkbox"
            checked={profileCommentsEnabled}
            onChange={(e) => setProfileCommentsEnabled(e.target.checked)}
          />
          Allow other users to leave comments on my profile
        </label>
        <ProfileCommentsSection userId={user.id} commentsEnabled={profileCommentsEnabled} />
      </div>

      {isExpo && (
        <div style={styles.communityBox}>
          <h3 style={styles.subtitle}>Community networking</h3>
          <p style={styles.communityNote}>
            Off by default, your contact stays private. Turn this on to attach a contact card
            (your email plus the handle and booth below) to your Community posts so other Expo
            vendors can reach you.
          </p>
          <label style={styles.toggleRow}>
            <input type="checkbox" checked={shareContact} onChange={(e) => setShareContact(e.target.checked)} />
            Share my contact card in the Community
          </label>
          {shareContact && (
            <div style={styles.communityFields}>
              <div style={{ flex: 1 }}>
                <label style={form.uppercaseLabel}>Handle (optional)</label>
                <input value={communityHandle} onChange={(e) => setCommunityHandle(e.target.value)} style={form.input} placeholder="@yourbrand" maxLength={60} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={form.uppercaseLabel}>Booth (optional)</label>
                <input value={communityBooth} onChange={(e) => setCommunityBooth(e.target.value)} style={form.input} placeholder="e.g. B12" maxLength={60} />
              </div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleSave}
        style={{ ...styles.primaryBtn, opacity: isDirty ? 1 : 0.5 }}
        disabled={!isDirty || isSaving}
      >
        {isSaving ? 'Saving…' : 'Save Changes'}
      </button>

      {/* Change password */}
      <div style={styles.divider} />
      <div>
        <h3 style={styles.subtitle}>Change password</h3>
        {pwError && <div style={{ ...detail.error, marginBottom: '10px' }}>{pwError}</div>}
        <div style={styles.pwFields}>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            style={form.input}
            placeholder="Current password"
            autoComplete="current-password"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={form.input}
            placeholder="New password (min 8 characters)"
            autoComplete="new-password"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={form.input}
            placeholder="Confirm new password"
            autoComplete="new-password"
          />
          <button
            onClick={handleChangePassword}
            style={styles.secondaryWideBtn}
            disabled={isChangingPw || !currentPassword || !newPassword}
          >
            {isChangingPw ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </div>

      {/* Read-only teams/locations */}
      <div style={styles.divider} />
      <div>
        <h3 style={styles.subtitle}>Teams &amp; Locations</h3>
        <p style={styles.hint}>
          This determines which tickets and reports you can see, in addition to your own submissions.
        </p>

        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Home location:</span>
          <span>{user.homeLocation?.name || 'Unknown'}</span>
        </div>

        {user.teams && user.teams.length > 0 ? (
          <div style={styles.teamsList}>
            {user.teams.map((team) => (
              <div key={team.id} style={styles.teamCard}>
                <div style={styles.teamName}>{team.name}</div>
                <div style={styles.tags}>
                  {team.tags && team.tags.length > 0 ? (
                    team.tags.map((tag) => (
                      <span key={tag.id} style={styles.tag}>
                        {tag.name}
                      </span>
                    ))
                  ) : (
                    <span style={styles.noTags}>No tags</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.noTags}>Not assigned to any team yet.</p>
        )}
      </div>
    </DetailPage>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
    cursor: 'pointer',
    backgroundColor: 'var(--accent-soft)',
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
  avatarActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  field: {
    marginBottom: '18px',
  },
  fieldLast: {
    marginBottom: '20px',
  },
  charCount: {
    fontSize: '11px',
    color: 'var(--text-faint)',
    textAlign: 'right',
    marginTop: '4px',
  },
  primaryBtn: {
    width: '100%',
    padding: '11px 18px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '9px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
  secondaryBtn: {
    padding: '8px 15px',
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--border-strong)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12.5px',
    fontWeight: 600,
    color: 'var(--text)',
  },
  secondaryWideBtn: {
    width: '100%',
    padding: '11px 18px',
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--border-strong)',
    borderRadius: '9px',
    cursor: 'pointer',
    fontSize: '13.5px',
    fontWeight: 600,
    color: 'var(--text)',
  },
  dangerLinkBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--danger-text)',
    fontSize: '12.5px',
    cursor: 'pointer',
    padding: 0,
  },
  divider: {
    borderTop: '1px solid var(--border)',
    margin: '26px 0 22px',
  },
  subtitle: {
    fontSize: '15px',
    fontWeight: 700,
    margin: '0 0 6px',
    color: 'var(--text)',
  },
  communityBox: {
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '18px',
    backgroundColor: 'var(--surface-alt)',
  },
  communityNote: {
    fontSize: '12.5px',
    color: 'var(--text-muted)',
    lineHeight: 1.5,
    margin: '0 0 12px',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13.5px',
    color: 'var(--text)',
    cursor: 'pointer',
  },
  privacyOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  communityFields: {
    display: 'flex',
    gap: '12px',
    marginTop: '14px',
    flexWrap: 'wrap' as const,
  },
  goalTagOptions: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '10px 16px',
    marginTop: '10px',
  },
  goalTagOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: 'var(--text)',
    cursor: 'pointer',
  },
  hint: {
    fontSize: '12.5px',
    color: 'var(--text-faint)',
    margin: '0 0 16px',
    lineHeight: 1.5,
  },
  pwFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  detailRow: {
    display: 'flex',
    gap: '8px',
    fontSize: '13.5px',
    marginBottom: '16px',
  },
  detailLabel: {
    fontWeight: 600,
    color: 'var(--text)',
  },
  teamsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  teamCard: {
    padding: '13px 15px',
    backgroundColor: 'var(--bg)',
    borderRadius: '9px',
  },
  teamName: {
    fontSize: '13.5px',
    fontWeight: 700,
    color: 'var(--text)',
    marginBottom: '7px',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  tag: {
    display: 'inline-block',
    padding: '3px 10px',
    backgroundColor: 'var(--accent-soft)',
    color: 'var(--accent-text)',
    borderRadius: '12px',
    fontSize: '11.5px',
    fontWeight: 600,
  },
  noTags: {
    fontSize: '13px',
    color: 'var(--text-faint)',
    fontStyle: 'italic',
  },
};
