import { useEffect, useMemo, useRef, useState } from 'react';
import { compressImage } from '../imageUtils';

interface PhotoPickerProps {
  photos: File[];
  onChange: (photos: File[]) => void;
  disabled?: boolean;
}

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
          📷 Take Photo
        </button>
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          style={styles.galleryBtn}
          disabled={disabled || isProcessing}
        >
          🖼️ Choose Photos
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
                ✕
              </button>
              <div style={styles.thumbSize}>{(photo.size / 1024).toFixed(0)} KB</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  hiddenInput: {
    display: 'none',
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },
  cameraBtn: {
    flex: '1 1 140px',
    padding: '12px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500' as const,
  },
  galleryBtn: {
    flex: '1 1 140px',
    padding: '12px 16px',
    backgroundColor: 'var(--surface)',
    color: '#007bff',
    border: '1px solid #007bff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500' as const,
  },
  processing: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    marginTop: '8px',
    marginBottom: 0,
  },
  thumbGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
    gap: '12px',
    marginTop: '16px',
  },
  thumbCard: {
    position: 'relative' as const,
    borderRadius: '4px',
    overflow: 'hidden',
    border: '1px solid var(--border-strong)',
    backgroundColor: 'var(--bg)',
  },
  thumbImage: {
    width: '100%',
    height: '96px',
    objectFit: 'cover' as const,
    display: 'block',
  },
  removeBtn: {
    position: 'absolute' as const,
    top: '4px',
    right: '4px',
    width: '24px',
    height: '24px',
    minHeight: '24px',
    borderRadius: '12px',
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    lineHeight: 1,
    padding: 0,
  },
  thumbSize: {
    fontSize: '11px',
    color: 'var(--text-faint)',
    textAlign: 'center' as const,
    padding: '4px 0',
  },
};
