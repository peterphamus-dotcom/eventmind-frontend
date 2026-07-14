import { useEffect, useState } from 'react';
import { api, photoSrc } from '../api';

const DISMISS_KEY = 'dismissedBanner';

/**
 * Top-of-app header. Shows the admin-set cover photo (like a social
 * media header) and, below it, the announcement message. The photo is
 * always shown; the message can be dismissed until it changes.
 */
export function BannerBar() {
  const [message, setMessage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    api
      .getBanner()
      .then((res) => {
        const data = res.data.data;
        if (!data) return;
        setImageUrl(data.imageUrl || null);
        const msg = data.message?.trim();
        if (msg && localStorage.getItem(DISMISS_KEY) !== msg) {
          setMessage(msg);
        }
      })
      .catch(() => {
        /* no banner on failure */
      });
  }, []);

  if (!message && !imageUrl) return null;

  function dismiss() {
    if (message) localStorage.setItem(DISMISS_KEY, message);
    setMessage(null);
  }

  return (
    <div>
      {imageUrl && <img src={photoSrc(imageUrl)} alt="" style={styles.headerImg} />}
      {message && (
        <div style={styles.bar}>
          <span style={styles.icon}>📢</span>
          <span style={styles.text}>{message}</span>
          <button onClick={dismiss} style={styles.close} aria-label="Dismiss banner">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  headerImg: {
    display: 'block',
    width: '100%',
    height: 'clamp(120px, 26vw, 260px)',
    objectFit: 'cover' as const,
    backgroundColor: '#e5e5e5',
  },
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
