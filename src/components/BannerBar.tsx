import { useEffect, useState } from 'react';
import { api, photoSrc } from '../api';

const ROTATE_MS = 6000;

/**
 * Top-of-app header. Shows the admin-set cover photo (like a social
 * media header) and, below it, the announcement message(s). Messages
 * are re-fetched on every mount (each new session / page load), cannot
 * be dismissed, and cycle one at a time when there is more than one.
 */
export function BannerBar() {
  const [messages, setMessages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    api
      .getBanner()
      .then((res) => {
        const data = res.data.data;
        if (!data) return;
        setImageUrl(data.imageUrl || null);
        const list = (data.messages || []).map((m) => m.trim()).filter(Boolean);
        setMessages(list);
        setIndex(0);
      })
      .catch(() => {
        /* no banner on failure */
      });
  }, []);

  // Cycle through messages when there is more than one.
  useEffect(() => {
    if (messages.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [messages]);

  if (messages.length === 0 && !imageUrl) return null;

  const current = messages[index] ?? messages[0];

  return (
    <div>
      <style>{'@keyframes bannerFade{from{opacity:0}to{opacity:1}}'}</style>
      {imageUrl && <img src={photoSrc(imageUrl)} alt="" style={styles.headerImg} />}
      {current && (
        <div style={styles.bar}>
          <span style={styles.icon}>📢</span>
          <span key={index} style={styles.text}>{current}</span>
          {messages.length > 1 && (
            <span style={styles.dots} aria-hidden>
              {messages.map((_, i) => (
                <span key={i} style={i === index ? styles.dotActive : styles.dot} />
              ))}
            </span>
          )}
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
    animation: 'bannerFade 0.4s ease',
  },
  dots: {
    display: 'flex',
    gap: '5px',
    flexShrink: 0,
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'white',
  },
};
