import { useEffect, useState } from 'react';
import { api, photoSrc } from '../api';

/**
 * Top-of-app header. Shows the admin-set cover photo (like a social
 * media header) and, below it, the announcement messages as a
 * continuous horizontal ticker. Re-fetched on every mount (each new
 * session / page load), non-dismissible, and paused on hover.
 */
export function BannerBar() {
  const [messages, setMessages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    api
      .getBanner()
      .then((res) => {
        const data = res.data.data;
        if (!data) return;
        setImageUrl(data.imageUrl || null);
        setMessages((data.messages || []).map((m) => m.trim()).filter(Boolean));
      })
      .catch(() => {
        /* no banner on failure */
      });
  }, []);

  if (messages.length === 0 && !imageUrl) return null;

  // Scroll speed scales with content length so long tickers aren't a blur.
  const charCount = messages.reduce((n, m) => n + m.length + 3, 0);
  const duration = Math.max(18, Math.round(charCount * 0.35));

  // One copy of the messages, each followed by a separator so the loop
  // stays evenly spaced where the duplicated copies meet.
  const group = (copy: number) => (
    <span style={styles.group} aria-hidden={copy > 0}>
      {messages.map((m, i) => (
        <span key={i}>
          <span style={styles.item}>{m}</span>
          <span style={styles.sep}>◆</span>
        </span>
      ))}
    </span>
  );

  return (
    <div>
      <style>{TICKER_CSS}</style>
      {imageUrl && <img src={photoSrc(imageUrl)} alt="" style={styles.headerImg} />}
      {messages.length > 0 && (
        <div style={styles.bar}>
          <span style={styles.icon}>📢</span>
          <div className="banner-viewport" style={styles.viewport}>
            <div className="banner-track" style={{ animationDuration: `${duration}s` }}>
              {group(0)}
              {group(1)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const TICKER_CSS = `
.banner-track {
  display: inline-flex;
  white-space: nowrap;
  animation-name: bannerScroll;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: transform;
}
.banner-viewport:hover .banner-track { animation-play-state: paused; }
@keyframes bannerScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce) {
  .banner-track { animation: none; }
}
`;

const styles = {
  headerImg: {
    display: 'block',
    width: '100%',
    height: 'clamp(120px, 26vw, 260px)',
    objectFit: 'cover' as const,
    backgroundColor: 'var(--border)',
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
    overflow: 'hidden',
  },
  icon: {
    fontSize: '16px',
    flexShrink: 0,
  },
  viewport: {
    flex: 1,
    overflow: 'hidden',
  },
  group: {
    display: 'inline-flex',
    alignItems: 'center',
  },
  item: {
    fontWeight: '500' as const,
  },
  sep: {
    padding: '0 22px',
    opacity: 0.5,
    fontSize: '10px',
  },
};
