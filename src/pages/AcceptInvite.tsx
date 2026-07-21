import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';

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
        <div style={styles.card}>
          <p style={styles.subtitle}>Loading your invite…</p>
        </div>
      </div>
    );
  }

  if (invalid) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Invite invalid or expired</h1>
          <p style={styles.subtitle}>This invite link is no longer valid. Ask whoever invited you to send a new one.</p>
          <Link to="/login" style={styles.link}>Back to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>You're invited 🎉</h1>
        <p style={styles.subtitle}>
          {inviterName ? `${inviterName} invited you` : 'You were invited'} to join EventMind as{' '}
          <strong>{email}</strong>. Set up your account below — an admin will approve your access next.
        </p>

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
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--bg)',
    padding: '20px',
  },
  card: {
    backgroundColor: 'var(--surface)',
    borderRadius: '8px',
    boxShadow: '0 2px 10px var(--shadow)',
    padding: '40px',
    maxWidth: '400px',
    width: '100%',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: 'var(--text)',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    marginBottom: '24px',
    lineHeight: 1.5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--text)',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
  },
  button: {
    padding: '10px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '8px',
  },
  error: {
    padding: '10px 12px',
    backgroundColor: 'var(--danger-bg)',
    color: 'var(--danger-text)',
    borderRadius: '4px',
    fontSize: '14px',
  },
  link: {
    color: '#007bff',
    fontWeight: 600,
    textDecoration: 'none',
  },
};
