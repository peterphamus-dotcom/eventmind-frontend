import { useEffect, useRef, useState, useCallback } from 'react';

interface Props {
  /** The raw image the admin picked. */
  file: File;
  /** Crop frame aspect ratio (width / height). Header default ≈ 3:1. */
  aspect?: number;
  /** Longest edge of the exported image, in px. */
  outputWidth?: number;
  onCancel: () => void;
  onConfirm: (cropped: File) => void;
}

/**
 * A dependency-free crop + zoom editor. The user pans (drag) and zooms
 * (slider / wheel / pinch) an image inside a fixed-aspect frame; on
 * confirm we render exactly the framed region to a canvas and hand back
 * a JPEG File. WYSIWYG with the header's object-fit: cover display.
 */
export default function ImageCropper({
  file,
  aspect = 3,
  outputWidth = 1500,
  onCancel,
  onConfirm,
}: Props) {
  const [src, setSrc] = useState('');
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [frameW, setFrameW] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);

  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);

  const frameH = frameW / aspect;
  const baseScale = nat && frameW ? Math.max(frameW / nat.w, frameH / nat.h) : 1;

  // Load the picked file into an object URL + read natural dimensions.
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    const img = new Image();
    img.onload = () => setNat({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Track the frame's rendered width so the math stays in real pixels.
  useEffect(() => {
    function measure() {
      if (frameRef.current) setFrameW(frameRef.current.clientWidth);
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const clampOff = useCallback(
    (x: number, y: number, z: number) => {
      if (!nat) return { x, y };
      const dW = nat.w * baseScale * z;
      const dH = nat.h * baseScale * z;
      return {
        x: Math.min(0, Math.max(frameW - dW, x)),
        y: Math.min(0, Math.max(frameH - dH, y)),
      };
    },
    [nat, baseScale, frameW, frameH]
  );

  // Center the image once we know its size and the frame's size.
  useEffect(() => {
    if (nat && frameW) {
      const dW = nat.w * baseScale;
      const dH = nat.h * baseScale;
      setZoom(1);
      setOffset({ x: (frameW - dW) / 2, y: (frameH - dH) / 2 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nat, frameW]);

  // Zoom about the frame's center so the focal point stays put.
  const applyZoom = useCallback(
    (nz: number) => {
      const clamped = Math.min(4, Math.max(1, nz));
      const ratio = clamped / zoom;
      const nx = frameW / 2 - (frameW / 2 - offset.x) * ratio;
      const ny = frameH / 2 - (frameH / 2 - offset.y) * ratio;
      setZoom(clamped);
      setOffset(clampOff(nx, ny, clamped));
    },
    [zoom, offset, frameW, frameH, clampOff]
  );

  function onPointerDown(e: React.PointerEvent) {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    setOffset(clampOff(drag.current.ox + dx, drag.current.oy + dy, zoom));
  }
  function onPointerUp() {
    drag.current = null;
  }

  function onWheel(e: React.WheelEvent) {
    applyZoom(zoom * (e.deltaY < 0 ? 1.08 : 0.92));
  }

  // Two-finger pinch zoom on touch devices.
  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      pinch.current = { dist: touchDist(e), zoom };
    }
  }
  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinch.current) {
      applyZoom(pinch.current.zoom * (touchDist(e) / pinch.current.dist));
    }
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (e.touches.length < 2) pinch.current = null;
  }

  async function handleConfirm() {
    if (!nat) return;
    setSaving(true);
    const scale = baseScale * zoom;
    const sx = -offset.x / scale;
    const sy = -offset.y / scale;
    const sW = frameW / scale;
    const sH = frameH / scale;
    const outW = outputWidth;
    const outH = Math.round(outW / aspect);

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setSaving(false);
      return;
    }
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, sx, sy, sW, sH, 0, 0, outW, outH);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setSaving(false);
            return;
          }
          onConfirm(new File([blob], 'header.jpg', { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.85
      );
    };
    img.src = src;
  }

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.heading}>Position header photo</h3>
        <p style={styles.hint}>Drag to move · scroll or pinch to zoom.</p>

        <div
          ref={frameRef}
          style={{ ...styles.frame, aspectRatio: String(aspect) }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {src && nat && frameW > 0 && (
            <img
              src={src}
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                left: offset.x,
                top: offset.y,
                width: nat.w * baseScale * zoom,
                height: nat.h * baseScale * zoom,
                maxWidth: 'none',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            />
          )}
        </div>

        <div style={styles.zoomRow}>
          <span style={styles.zoomIcon}>➖</span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => applyZoom(parseFloat(e.target.value))}
            style={styles.slider}
          />
          <span style={styles.zoomIcon}>➕</span>
        </div>

        <div style={styles.actions}>
          <button type="button" onClick={onCancel} style={styles.cancelBtn} disabled={saving}>
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} style={styles.applyBtn} disabled={saving || !nat}>
            {saving ? 'Applying…' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
}

function touchDist(e: React.TouchEvent) {
  const [a, b] = [e.touches[0], e.touches[1]];
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'var(--overlay)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'var(--surface)',
    borderRadius: '10px',
    padding: '20px',
    width: 'min(92vw, 640px)',
    boxShadow: '0 10px 40px var(--shadow)',
  },
  heading: {
    fontSize: '17px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: '0 0 4px',
  },
  hint: {
    fontSize: '13px',
    color: 'var(--text-faint)',
    margin: '0 0 14px',
  },
  frame: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    borderRadius: '6px',
    backgroundColor: '#111',
    cursor: 'grab',
    touchAction: 'none',
  },
  zoomRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '16px 0 4px',
  },
  zoomIcon: {
    fontSize: '12px',
    userSelect: 'none',
  },
  slider: {
    flex: 1,
    cursor: 'pointer',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '16px',
  },
  cancelBtn: {
    padding: '9px 18px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  },
  applyBtn: {
    padding: '9px 18px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
};
