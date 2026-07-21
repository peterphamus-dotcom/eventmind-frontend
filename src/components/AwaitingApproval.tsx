import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

interface AwaitingApprovalProps {
  onOpenDisplaySettings: () => void;
}

/** The waiting-room view shown to PENDING users in place of the dashboard tabs.
 * They can tidy up their profile and settings while an admin reviews them. */
export function AwaitingApproval({ onOpenDisplaySettings }: AwaitingApprovalProps) {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [checkedMsg, setCheckedMsg] = useState<string | null>(null);

  async function checkStatus() {
    setChecking(true);
    setCheckedMsg(null);
    await refreshUser();
    // If still pending after refresh, let them know nothing changed yet.
    setChecking(false);
    setCheckedMsg('Still awaiting approval — we’ll email you the moment you’re in.');
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.hero}>
        <div style={styles.emoji}>⏳</div>
        <h2 style={styles.heading}>Awaiting admin approval</h2>
        <p style={styles.sub}>
          Thanks, {user?.name?.split(' ')[0] || 'there'}! Your account is set up. An admin or core-team
          member needs to approve you before you can access the event workspace. You’ll get an email
          and a notification the moment you’re approved.
        </p>
        <button onClick={checkStatus} style={styles.checkBtn} disabled={checking}>
          {checking ? 'Checking…' : '🔄 Check approval status'}
        </button>
        {checkedMsg && <p style={styles.checkedMsg}>{checkedMsg}</p>}
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Things you can do while you wait</h3>
        <div style={styles.actions}>
          <button style={styles.action} onClick={() => navigate('/profile')}>
            <span style={styles.actionEmoji}>👤</span>
            <span>
              <span style={styles.actionLabel}>Complete your profile</span>
              <span style={styles.actionHint}>Add a photo, bio, and contact info so your team recognizes you.</span>
            </span>
          </button>
          <button style={styles.action} onClick={onOpenDisplaySettings}>
            <span style={styles.actionEmoji}>🖥️</span>
            <span>
              <span style={styles.actionLabel}>Adjust display settings</span>
              <span style={styles.actionHint}>Pick light or dark mode and how densely lists are shown.</span>
            </span>
          </button>
          <button style={styles.action} onClick={() => navigate('/profile')}>
            <span style={styles.actionEmoji}>🔒</span>
            <span>
              <span style={styles.actionLabel}>Change your password</span>
              <span style={styles.actionHint}>Update the password you signed up with, from your profile.</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    maxWidth: '640px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  hero: {
    textAlign: 'center' as const,
    padding: '32px 20px',
  },
  emoji: {
    fontSize: '48px',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--text)',
    margin: '12px 0 8px 0',
  },
  sub: {
    fontSize: '15px',
    color: 'var(--text-muted)',
    lineHeight: 1.6,
    margin: '0 auto 20px auto',
    maxWidth: '480px',
  },
  checkBtn: {
    padding: '10px 18px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
  checkedMsg: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    marginTop: '12px',
  },
  card: {
    backgroundColor: 'var(--surface)',
    borderRadius: '8px',
    boxShadow: '0 1px 4px var(--shadow)',
    padding: '20px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--text)',
    margin: '0 0 16px 0',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  action: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    textAlign: 'left' as const,
    padding: '14px',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    backgroundColor: 'var(--bg)',
    cursor: 'pointer',
    width: '100%',
  },
  actionEmoji: {
    fontSize: '22px',
    lineHeight: 1,
    flexShrink: 0,
  },
  actionLabel: {
    display: 'block',
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: '2px',
  },
  actionHint: {
    display: 'block',
    fontSize: '13px',
    color: 'var(--text-muted)',
    lineHeight: 1.4,
  },
};
