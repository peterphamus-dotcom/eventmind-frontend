import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';

export function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const { register, error } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await register(email, password, name);
      setSentTo(result.email);
    } catch {
      // error surfaced via context
    } finally {
      setIsLoading(false);
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

  // Post-signup confirmation screen.
  if (sentTo) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Check your email 📬</h1>
          <p style={styles.subtitle}>
            We sent a confirmation link to <strong>{sentTo}</strong>. Click it to confirm your
            address — then an admin will review your request for access.
          </p>
          <button type="button" onClick={handleResend} style={styles.secondaryButton}>
            Resend confirmation email
          </button>
          {resendMsg && <p style={styles.noticeText}>{resendMsg}</p>}
          <p style={styles.footer}>
            <Link to="/login" style={styles.link}>Back to login</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create your account</h1>
        <p style={styles.subtitle}>Join your team on EventMind. Access is granted after an admin approves you.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              placeholder="Your name"
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.button} disabled={isLoading}>
            {isLoading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account? <Link to="/login" style={styles.link}>Log in</Link>
        </p>
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
    fontSize: '26px',
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
  secondaryButton: {
    padding: '10px 16px',
    backgroundColor: 'transparent',
    color: '#007bff',
    border: '1px solid var(--border-strong)',
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
  noticeText: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    margin: '12px 0 0 0',
  },
  footer: {
    marginTop: '24px',
    fontSize: '14px',
    color: 'var(--text-muted)',
    textAlign: 'center' as const,
  },
  link: {
    color: '#007bff',
    fontWeight: 600,
    textDecoration: 'none',
  },
};
