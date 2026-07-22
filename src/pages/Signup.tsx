import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import { AuthCard, styles } from '../components/AuthCard';

const UserPlusIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="16" y1="11" x2="22" y2="11" />
  </svg>
);

const MailIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

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
      icon={UserPlusIcon}
      title="Create your account"
      titleSize={24}
      subtitle="Join your team on EventMind. Access is granted after an admin approves you."
      footer={
        <p style={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>
            Log in
          </Link>
        </p>
      }
    >
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
    </AuthCard>
  );
}
