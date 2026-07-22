import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { useToast } from '../Toast';
import { api, photoSrc } from '../api';
import { DetailPage, styles as detail } from '../components/DetailPage';
import { styles as form } from '../components/FormPage';

export function Profile() {
  const { user, refreshUser } = useAuth();
  const showToast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
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
    }
  }, [user]);

  if (!user) return <div style={detail.loading}>Loading…</div>;

  const isDirty = name !== user.name || phone !== (user.phone || '') || bio !== (user.bio || '');

  async function handleSave() {
    if (isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      await api.updateMyProfile({ name, phone, bio });
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
