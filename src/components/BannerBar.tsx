import { useEffect, useState } from 'react';
import { api } from '../api';

const DISMISS_KEY = 'dismissedBanner';

/**
 * Top-of-app announcement bar. Shows the admin-set banner to every
 * logged-in user. A user can dismiss it; it stays hidden until the
 * message changes.
 */
export function BannerBar() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api
      .getBanner()
      .then((res) => {
        const msg = res.data.data?.message?.trim();
        if (msg && localStorage.getItem(DISMISS_KEY) !== msg) {
          setMessage(msg);
        }
      })
      .catch(() => {
        /* no banner on failure */
      });
  }, []);

  if (!message) return null;

  function dismiss() {
    if (message) localStorage.setItem(DISMISS_KEY, message);
    setMessage(null);
  }

  return (
    <div style={styles.bar}>
      <span style={styles.icon}>📢</span>
      <span style={styles.text}>{message}</span>
      <button onClick={dismiss} style={styles.close} aria-label="Dismiss banner">
        ✕
      </button>
    </div>
  );
}

const styles = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px clamp(16px, 4vw, 40px)',
    backgroundColor: '#0d3b66',
    color: 'white',
    fontSize: '14px',
    lineHeight: 1.4,
  },
  icon: {
    fontSize: '16px',
    flexShrink: 0,
  },
  text: {
    flex: 1,
    fontWeight: '500' as const,
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
  },
  close: {
    flexShrink: 0,
    background: 'transparent',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    opacity: 0.8,
    padding: '4px',
  },
};
