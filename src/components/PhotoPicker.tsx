import { useEffect, useMemo, useRef, useState } from 'react';
import { compressImage } from '../imageUtils';

interface PhotoPickerProps {
  photos: File[];
  onChange: (photos: File[]) => void;
  disabled?: boolean;
}

const CameraIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const GalleryIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

/**
 * Camera-first photo picker: "Take Photo" opens the device camera
 * directly on mobile; "Choose Photos" opens the gallery/file picker.
 * Files are compressed client-side and previewed as thumbnails.
 */
export function PhotoPicker({ photos, onChange, disabled }: PhotoPickerProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const previews = useMemo(() => photos.map((p) => URL.createObjectURL(p)), [photos]);
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  async function addFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // allow re-selecting the same file
    if (files.length === 0) return;

    setIsProcessing(true);
    try {
      const compressed = await Promise.all(files.map((f) => compressImage(f)));
      onChange([...photos, ...compressed]);
    } finally {
      setIsProcessing(false);
    }
  }

  function removePhoto(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  return (
    <div>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={addFiles}
        style={styles.hiddenInput}
        disabled={disabled}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={addFiles}
        style={styles.hiddenInput}
        disabled={disabled}
      />

      <div style={styles.buttonRow}>
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          style={styles.cameraBtn}
          disabled={disabled || isProcessing}
        >
          {CameraIcon}
          Take Photo
        </button>
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          style={styles.galleryBtn}
          disabled={disabled || isProcessing}
        >
          {GalleryIcon}
          Choose Photos
        </button>
      </div>

      {isProcessing && <p style={styles.processing}>Processing photos…</p>}

      {photos.length > 0 && (
        <div style={styles.thumbGrid}>
          {photos.map((photo, idx) => (
            <div key={idx} style={styles.thumbCard}>
              <img src={previews[idx]} alt={photo.name} style={styles.thumbImage} />
              <button
                type="button"
                onClick={() => removePhoto(idx)}
                style={styles.removeBtn}
                disabled={disabled}
                aria-label={`Remove ${photo.name}`}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <div style={styles.thumbSize}>{(photo.size / 1024).toFixed(0)} KB</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  hiddenInput: {
    display: 'none',
  },
  buttonRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  cameraBtn: {
    flex: '1 1 140px',
    padding: '12px 16px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '9px',
    cursor: 'pointer',
    fontSize: '13.5px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
  },
  galleryBtn: {
    flex: '1 1 140px',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    color: 'var(--accent)',
    border: '1px solid var(--accent)',
    borderRadius: '9px',
    cursor: 'pointer',
    fontSize: '13.5px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
  },
  processing: {
    fontSize: '12.5px',
    color: 'var(--text-muted)',
    marginTop: '8px',
    marginBottom: 0,
  },
  thumbGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
    gap: '10px',
    marginTop: '6px',
  },
  thumbCard: {
    position: 'relative',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid var(--border-strong)',
    backgroundColor: 'var(--bg)',
  },
  thumbImage: {
    width: '100%',
    height: '88px',
    objectFit: 'cover',
    display: 'block',
  },
  removeBtn: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    width: '20px',
    height: '20px',
    minHeight: '20px',
    borderRadius: '10px',
    backgroundColor: 'oklch(0% 0 0 / 0.55)',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  thumbSize: {
    fontSize: '10px',
    color: 'var(--text-faint)',
    textAlign: 'center',
    padding: '3px 0',
    backgroundColor: 'var(--surface)',
  },
};
