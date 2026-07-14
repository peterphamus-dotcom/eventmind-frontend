import { useState, useEffect, useRef } from 'react';
import { api } from '../../api';
import { useToast } from '../../Toast';
import ImageCropper from '../../components/ImageCropper';

export default function AdminBanner() {
  const showToast = useToast();
  const [message, setMessage] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .getBanner()
      .then((res) => {
        if (res.data.data) {
          setMessage(res.data.data.message);
          setIsActive(res.data.data.isActive);
          setImageUrl(res.data.data.imageUrl);
        }
      })
      .catch(() => setError('Failed to load current banner'))
      .finally(() => setIsLoading(false));
  }, []);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    // Open the crop/zoom editor; upload happens on Apply.
    setCropFile(file);
  }

  async function handleCropConfirm(cropped: File) {
    setCropFile(null);
    setIsUploading(true);
    setError(null);
    try {
      const res = await api.setBannerImage(cropped);
      setImageUrl(res.data.data!.imageUrl);
      showToast('Header photo updated');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload header photo');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemoveImage() {
    setIsUploading(true);
    setError(null);
    try {
      await api.removeBannerImage();
      setImageUrl(null);
      showToast('Header photo removed');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove header photo');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await api.setBanner(message, isActive);
      showToast(
        !message.trim() || !isActive ? 'Banner hidden' : 'Banner published'
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save banner');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClear() {
    setMessage('');
    setIsSaving(true);
    setError(null);
    try {
      await api.setBanner('', false);
      showToast('Banner hidden');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to clear banner');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <div style={styles.card}><p>Loading…</p></div>;

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Announcement Banner</h2>
      <p style={styles.subtitle}>
        Shown at the top of the app for every user. Leave empty or untick to hide it.
      </p>

      {error && <div style={styles.error}>{error}</div>}

      {/* Header photo */}
      <div style={styles.imageSection}>
        <label style={styles.fieldLabel}>Header photo</label>
        {imageUrl ? (
          <img src={imageUrl} alt="Header preview" style={styles.imagePreview} />
        ) : (
          <div style={styles.imagePlaceholder}>No header photo set</div>
        )}
        <p style={styles.imageHint}>You'll crop &amp; zoom after picking a photo.</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
        />
        <div style={styles.imageActions}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={styles.uploadBtn}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading…' : imageUrl ? '🖼️ Replace photo' : '🖼️ Upload photo'}
          </button>
          {imageUrl && (
            <button
              type="button"
              onClick={handleRemoveImage}
              style={styles.clearBtn}
              disabled={isUploading}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <hr style={styles.divider} />

      <form onSubmit={handleSave}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. Doors open at 6pm — all teams report to the main stage by 5:30."
          style={styles.textarea}
          rows={3}
          disabled={isSaving}
        />

        <label style={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            disabled={isSaving}
          />
          Show banner to everyone
        </label>

        {/* Live preview */}
        {message.trim() && isActive && (
          <div style={styles.preview}>
            <span>📢</span>
            <span>{message}</span>
          </div>
        )}

        <div style={styles.actions}>
          <button type="submit" style={styles.saveBtn} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save Banner'}
          </button>
          <button type="button" onClick={handleClear} style={styles.clearBtn} disabled={isSaving}>
            Clear
          </button>
        </div>
      </form>

      {cropFile && (
        <ImageCropper
          file={cropFile}
          aspect={3}
          onCancel={() => setCropFile(null)}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '32px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600' as const,
    marginBottom: '4px',
    color: '#333',
  },
  subtitle: {
    fontSize: '13px',
    color: '#888',
    marginBottom: '20px',
  },
  error: {
    padding: '12px 16px',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  imageSection: {
    marginBottom: '20px',
  },
  fieldLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600' as const,
    color: '#555',
    marginBottom: '8px',
  },
  imagePreview: {
    display: 'block',
    width: '100%',
    height: '160px',
    objectFit: 'cover' as const,
    borderRadius: '6px',
    marginBottom: '10px',
    backgroundColor: '#eee',
  },
  imagePlaceholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '120px',
    borderRadius: '6px',
    border: '2px dashed #ddd',
    color: '#999',
    fontSize: '14px',
    marginBottom: '10px',
  },
  imageHint: {
    fontSize: '12px',
    color: '#999',
    margin: '0 0 10px',
  },
  imageActions: {
    display: 'flex',
    gap: '10px',
  },
  uploadBtn: {
    padding: '9px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500' as const,
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #eee',
    margin: '20px 0',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    marginBottom: '12px',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#333',
    marginBottom: '16px',
    cursor: 'pointer',
  },
  preview: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    backgroundColor: '#0d3b66',
    color: 'white',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500' as const,
    marginBottom: '16px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
  },
  saveBtn: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600' as const,
  },
  clearBtn: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500' as const,
  },
};
