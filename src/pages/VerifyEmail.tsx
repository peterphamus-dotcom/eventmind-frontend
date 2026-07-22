import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { AuthCard, AuthSpinner, styles } from '../components/AuthCard';

const XCircleIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

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

  // The spinner replaces the icon badge here, so this state builds the
  // card directly rather than going through AuthCard.
  if (state === 'verifying') {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.card, ...styles.cardCentered }}>
          <AuthSpinner />
          <h1 style={{ ...styles.title, fontSize: '20px' }}>Confirming your email…</h1>
          <p style={{ ...styles.subtitle, margin: 0 }}>One moment while we verify your link.</p>
        </div>
      </div>
    );
  }

  return (
    <AuthCard
      icon={XCircleIcon}
      tone="danger"
      centered
      title="Link invalid or expired"
      titleSize={20}
      subtitle="This confirmation link is no longer valid. Try logging in to request a new one."
    >
      <Link to="/login" style={{ ...styles.link, fontSize: '14px' }}>
        Back to login
      </Link>
    </AuthCard>
  );
}
