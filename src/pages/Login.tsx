import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, error } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      // Error is handled by context
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>EventMind</h1>
        <p style={styles.subtitle}>Live Event Intelligence Tracker</p>

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
              placeholder="password123"
              disabled={isLoading}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.button} disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {import.meta.env.MODE === 'development' && (
          <div style={styles.info}>
            <p style={styles.infoText}>Demo credentials (dev only):</p>
            <p style={styles.infoText}>👤 Member: dev@example.com / password123</p>
            <p style={styles.infoText}>🔐 Admin: admin@example.com / admin123</p>
          </div>
        )}
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
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: 'var(--text)',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    marginBottom: '30px',
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
  info: {
    marginTop: '24px',
    padding: '16px',
    backgroundColor: 'var(--bg)',
    borderRadius: '4px',
    borderLeft: '4px solid #007bff',
  },
  infoText: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    margin: '4px 0',
  },
};
