import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import { AuthCard, styles } from '../components/AuthCard';

const TicketIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" />
  </svg>
);

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const { login, error } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setNeedsVerification(false);
    setResendMsg(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      // Surface the "verify your email" path with a resend affordance.
      if (err?.response?.data?.code === 'EMAIL_UNVERIFIED') {
        setNeedsVerification(true);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    setResendMsg(null);
    try {
      const res = await api.resendVerification(email);
      setResendMsg(res.data.data?.message || 'Verification email sent.');
    } catch {
      setResendMsg('Could not resend right now. Please try again later.');
    }
  }

  return (
    <AuthCard
      icon={TicketIcon}
      title="EventMind"
      titleSize={24}
      subtitle="Live Event Intelligence Tracker"
      footer={
        <p style={styles.footer}>
          New here?{' '}
          <Link to="/signup" style={styles.link}>
            Create an account
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} style={styles.form}>
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
            placeholder="••••••••"
            disabled={isLoading}
            autoComplete="current-password"
          />
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {needsVerification && (
          <div>
            <button type="button" onClick={handleResend} style={styles.buttonSecondary}>
              Resend confirmation email
            </button>
            {resendMsg && <p style={styles.hint}>{resendMsg}</p>}
          </div>
        )}

        <button type="submit" style={styles.button} disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </AuthCard>
  );
}
