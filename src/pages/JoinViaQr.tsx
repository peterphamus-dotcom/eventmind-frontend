import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { AuthCard, AuthSpinner, styles } from '../components/AuthCard';
import type { Role } from '../types';

const QrIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <line x1="14" y1="14" x2="14" y2="21" />
    <line x1="21" y1="14" x2="21" y2="21" />
    <line x1="17.5" y1="14" x2="17.5" y2="17.5" />
    <line x1="14" y1="17.5" x2="21" y2="17.5" />
  </svg>
);

const XCircleIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const MailIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

const ROLE_LABEL: Record<Role, string> = {
  MEMBER: 'Member',
  CORE_TEAM: 'Core Team',
  ADMIN: 'Admin',
  EXPO: 'Expo',
};

const calloutStyle: React.CSSProperties = {
  padding: '10px 14px',
  backgroundColor: 'var(--accent-soft)',
  color: 'var(--accent-text)',
  borderRadius: '8px',
  fontSize: '13px',
  lineHeight: 1.5,
  marginBottom: '16px',
};

/** Public join page reached by scanning an admin/core-generated sign-up QR code. */
export function JoinViaQr() {
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [label, setLabel] = useState('');
  const [suggestedRole, setSuggestedRole] = useState<Role | null>(null);
  const [team, setTeam] = useState<{ id: string; name: string } | null>(null);
  const [homeLocation, setHomeLocation] = useState<{ id: string; name: string } | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setInvalid(true);
      setLoading(false);
      return;
    }
    api
      .getSignupQrInfo(token)
      .then((res) => {
        setLabel(res.data.data?.label || '');
        setSuggestedRole(res.data.data?.suggestedRole || null);
        setTeam(res.data.data?.team || null);
        setHomeLocation(res.data.data?.homeLocation || null);
      })
      .catch(() => setInvalid(true))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.joinViaSignupQr(token, email, password, name);
      setSentTo(res.data.data?.email || email);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to sign up');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (!sentTo) return;
    setResendMsg(null);
    try {
      const res = await api.resendVerification(sentTo);
      setResendMsg(res.data.data?.message || 'Verification email sent.');
    } catch {
      setResendMsg('Could not resend right now. Please try again later.');
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.card, ...styles.cardCentered }}>
          <AuthSpinner />
          <p style={{ ...styles.subtitle, margin: 0 }}>Loading sign-up link…</p>
        </div>
      </div>
    );
  }

  if (invalid) {
    return (
      <AuthCard
        icon={XCircleIcon}
        tone="danger"
        centered
        title="Sign-up link invalid"
        titleSize={20}
        subtitle="This sign-up link is invalid or has been deactivated. Ask whoever shared it for a current one."
      >
        <Link to="/login" style={{ ...styles.link, fontSize: '14px' }}>
          Back to login
        </Link>
      </AuthCard>
    );
  }

  if (sentTo) {
    return (
      <AuthCard
        icon={MailIcon}
        tone="soft"
        title="Check your email"
        subtitle={
          <>
            We sent a confirmation link to <b>{sentTo}</b>. Click it to confirm your address — then
            an admin will review your request for access.
          </>
        }
        footer={
          <p style={styles.footer}>
            <Link to="/login" style={styles.link}>
              Back to login
            </Link>
          </p>
        }
      >
        <button type="button" onClick={handleResend} style={styles.buttonSecondary}>
          Resend confirmation email
        </button>
        {resendMsg && <p style={styles.hint}>{resendMsg}</p>}
      </AuthCard>
    );
  }

  return (
    <AuthCard
      icon={QrIcon}
      tone="soft"
      title="You're signing up"
      titleSize={24}
      subtitle={<>Joining via “{label}”. Access is granted after an admin approves you.</>}
      footer={
        <p style={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>
            Log in
          </Link>
        </p>
      }
    >
      {(suggestedRole || team || homeLocation) && (
        <div style={calloutStyle}>
          Suggested for this sign-up:{' '}
          {suggestedRole && <b style={{ color: 'var(--text)' }}>{ROLE_LABEL[suggestedRole]}</b>}
          {suggestedRole && (team || homeLocation) ? ' · ' : ''}
          {team ? team.name : ''}
          {team && homeLocation ? ' at ' : ''}
          {homeLocation ? homeLocation.name : ''}. An admin will confirm this at approval.
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
            placeholder="Your name"
            disabled={submitting}
            autoComplete="name"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            placeholder="your@email.com"
            disabled={submitting}
            autoComplete="email"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            placeholder="At least 8 characters"
            disabled={submitting}
            autoComplete="new-password"
          />
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <button type="submit" style={styles.button} disabled={submitting}>
          {submitting ? 'Signing up…' : 'Sign up'}
        </button>
      </form>
    </AuthCard>
  );
}
