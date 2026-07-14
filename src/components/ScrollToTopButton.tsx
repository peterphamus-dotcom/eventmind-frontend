import { useEffect, useState } from 'react';

const SHOW_AFTER_PX = 400;

/** Floating button, bottom-right, that scrolls the page back to the top. Only visible once scrolled down. */
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
      style={styles.button}
    >
      ↑
    </button>
  );
}

const styles = {
  button: {
    position: 'fixed' as const,
    right: 'clamp(16px, 4vw, 32px)',
    bottom: 'clamp(16px, 4vw, 32px)',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#0d3b66',
    color: 'white',
    fontSize: '20px',
    lineHeight: 1,
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
    zIndex: 500,
  },
};
