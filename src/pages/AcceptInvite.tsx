import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import { AuthCard, AuthSpinner, styles } from '../components/AuthCard';

const UsersIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const XCircleIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

export function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const { acceptInvite, error } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [email, setEmail] = useState('');
  const [inviterName, setInviterName] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setInvalid(true);
      setLoading(false);
      return;
    }
    api
      .getInvite(token)
      .then((res) => {
        setEmail(res.data.data?.email || '');
        setInviterName(res.data.data?.inviterName || null);
      })
      .catch(() => setInvalid(true))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      await acceptInvite(token, name, password);
      navigate('/dashboard', { replace: true });
    } catch {
      // error surfaced via context
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.card, ...styles.cardCentered }}>
          <AuthSpinner />
          <p style={{ ...styles.subtitle, margin: 0 }}>Loading your invite…</p>
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
        title="Invite invalid or expired"
        titleSize={20}
        subtitle="This invite link is no longer valid. Ask whoever invited you to send a new one."
      >
        <Link to="/login" style={{ ...styles.link, fontSize: '14px' }}>
          Back to login
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      icon={UsersIcon}
      tone="soft"
      title="You're invited"
      subtitle={
        <>
          {inviterName ? `${inviterName} invited you` : 'You were invited'} to join EventMind as{' '}
          <b style={{ color: 'var(--text)' }}>{email}</b>. Set up your account below — an admin will
          approve your access next.
        </>
      }
    >
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Your name</label>
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
          {submitting ? 'Setting up…' : 'Create account'}
        </button>
      </form>
    </AuthCard>
  );
}
