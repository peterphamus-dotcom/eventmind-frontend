import { useState, type ImgHTMLAttributes } from 'react';
import { useLowData } from '../LowDataContext';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

/**
 * Drop-in <img> replacement. In Low Data Mode, renders a tap-to-load
 * placeholder instead of fetching the image until the user asks for it.
 */
export function LazyImage({ src, style, alt, ...rest }: LazyImageProps) {
  const { lowData } = useLowData();
  const [loaded, setLoaded] = useState(false);

  if (lowData && !loaded) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => setLoaded(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setLoaded(true);
        }}
        title="Tap to load image (Low Data Mode)"
        style={{ ...(style as object), ...placeholderStyle }}
      >
        <span style={{ fontSize: '16px' }}>🖼️</span>
        <span>Tap to load</span>
      </div>
    );
  }

  return <img src={src} alt={alt} style={style} {...rest} />;
}

const placeholderStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  backgroundColor: 'var(--border)',
  color: 'var(--text-muted)',
  fontSize: '11px',
  textAlign: 'center' as const,
  cursor: 'pointer',
};
