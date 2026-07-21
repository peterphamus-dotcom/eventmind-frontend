import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<'verifying' | 'error'>('verifying');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard React 18 StrictMode double-invoke
    ran.current = true;

    if (!token) {
      setState('error');
      return;
    }
    verifyEmail(token)
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(() => setState('error'));
  }, [token, verifyEmail, navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {state === 'verifying' ? (
          <>
            <h1 style={styles.title}>Confirming your email…</h1>
            <p style={styles.subtitle}>One moment while we verify your link.</p>
          </>
        ) : (
          <>
            <h1 style={styles.title}>Link invalid or expired</h1>
            <p style={styles.subtitle}>
              This confirmation link is no longer valid. Try logging in to request a new one.
            </p>
            <Link to="/login" style={styles.link}>Back to login</Link>
          </>
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
    textAlign: 'center' as const,
  },
  title: {
    fontSize: '22px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: 'var(--text)',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    marginBottom: '20px',
    lineHeight: 1.5,
  },
  link: {
    color: '#007bff',
    fontWeight: 600,
    textDecoration: 'none',
  },
};
