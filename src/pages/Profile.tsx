import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useToast } from '../Toast';
import { api, photoSrc } from '../api';

export function Profile() {
  const navigate = useNavigate();
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

  if (!user) return <div style={styles.loading}>Loading...</div>;

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
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
          ← Back to Dashboard
        </button>
        <h1 style={styles.title}>My Profile</h1>
      </div>

      <div style={styles.content}>
        <div style={styles.card}>
          {error && <div style={styles.error}>{error}</div>}

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
          <div style={styles.section}>
            <label style={styles.label}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              maxLength={100}
            />
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Email</label>
            <div style={styles.readOnlyValue}>{user.email}</div>
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Contact number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={styles.input}
              placeholder="e.g. (555) 123-4567"
              maxLength={30}
            />
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={styles.textarea}
              maxLength={500}
              rows={4}
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
          <div style={styles.section}>
            <h3 style={styles.subtitle}>Change password</h3>
            {pwError && <div style={styles.error}>{pwError}</div>}
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{ ...styles.input, marginBottom: '10px' }}
              placeholder="Current password"
              autoComplete="current-password"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ ...styles.input, marginBottom: '10px' }}
              placeholder="New password (min 8 characters)"
              autoComplete="new-password"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ ...styles.input, marginBottom: '14px' }}
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

          {/* Read-only teams/locations */}
          <div style={styles.divider} />
          <div style={styles.section}>
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
        </div>
      </div>
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
    gap: '12px',
    marginBottom: '28px',
    paddingBottom: '28px',
    borderBottom: '1px solid var(--border)',
  },
  avatarWrap: {
    width: '96px',
    height: '96px',
    borderRadius: '50%',
    overflow: 'hidden',
    cursor: 'pointer',
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
  avatarActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
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
  input: {
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
  readOnlyValue: {
    padding: '10px 12px',
    fontSize: '14px',
    color: 'var(--text-muted)',
    backgroundColor: 'var(--bg)',
    borderRadius: '4px',
  },
  primaryBtn: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600' as const,
    width: '100%',
  },
  secondaryBtn: {
    padding: '8px 16px',
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500' as const,
    color: 'var(--text)',
  },
  secondaryWideBtn: {
    padding: '10px 20px',
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600' as const,
    color: 'var(--text)',
    width: '100%',
  },
  dangerLinkBtn: {
    background: 'none',
    border: 'none',
    color: '#dc3545',
    fontSize: '13px',
    cursor: 'pointer',
    padding: 0,
  },
  divider: {
    borderTop: '1px solid var(--border)',
    margin: '28px 0 20px 0',
  },
  subtitle: {
    fontSize: '16px',
    fontWeight: '600' as const,
    margin: '0 0 6px 0',
    color: 'var(--text)',
  },
  hint: {
    fontSize: '13px',
    color: 'var(--text-faint)',
    margin: '0 0 16px 0',
  },
  detailRow: {
    display: 'flex',
    gap: '8px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  detailLabel: {
    fontWeight: '600' as const,
    color: 'var(--text)',
  },
  teamsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  teamCard: {
    padding: '12px',
    backgroundColor: 'var(--bg)',
    borderRadius: '6px',
  },
  teamName: {
    fontSize: '14px',
    fontWeight: '600' as const,
    color: 'var(--text)',
    marginBottom: '6px',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
  },
  tag: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: 'var(--tag-bg)',
    color: 'var(--tag-text)',
    borderRadius: '14px',
    fontSize: '12px',
    fontWeight: '500' as const,
  },
  noTags: {
    fontSize: '13px',
    color: 'var(--text-faint)',
    fontStyle: 'italic' as const,
  },
  loading: {
    padding: '20px',
    fontSize: '16px',
    color: 'var(--text-muted)',
  },
};
