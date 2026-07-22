import { useState, useEffect, useRef } from 'react';
import { api } from '../../api';
import { useToast } from '../../Toast';
import ImageCropper from '../../components/ImageCropper';
import { styles as shared } from '../../components/AdminShared';

const ImageIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-2px', marginRight: '6px' }}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const PlusIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ verticalAlign: '-2px', marginRight: '5px' }}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const XIcon = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const MegaphoneIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M3 11l18-5v12L3 13v-2z" />
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </svg>
);

export default function AdminBanner() {
  const showToast = useToast();
  const [messages, setMessages] = useState<string[]>(['']);
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
          const list = res.data.data.messages ?? [];
          setMessages(list.length ? list : ['']);
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

  function updateMessage(i: number, value: string) {
    setMessages((prev) => prev.map((m, idx) => (idx === i ? value : m)));
  }

  function addMessage() {
    setMessages((prev) => [...prev, '']);
  }

  function removeMessage(i: number) {
    setMessages((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      return next.length ? next : [''];
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const cleaned = messages.map((m) => m.trim()).filter(Boolean);
      await api.setBanner(cleaned, isActive);
      showToast(cleaned.length === 0 || !isActive ? 'Banner hidden' : 'Banner published');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save banner');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClear() {
    setMessages(['']);
    setIsSaving(true);
    setError(null);
    try {
      await api.setBanner([], false);
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
            {isUploading ? 'Uploading…' : (
              <>
                {ImageIcon}
                {imageUrl ? 'Replace photo' : 'Upload photo'}
              </>
            )}
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
        <label style={styles.fieldLabel}>Messages</label>
        <p style={styles.imageHint}>
          Add one or more announcements. When there's more than one they cycle in the bar.
        </p>

        {messages.map((msg, i) => (
          <div key={i} style={styles.msgRow}>
            <span style={styles.msgNum}>{i + 1}</span>
            <textarea
              value={msg}
              onChange={(e) => updateMessage(i, e.target.value)}
              placeholder="e.g. Doors open at 6pm — all teams report to the main stage by 5:30."
              style={styles.msgTextarea}
              rows={2}
              disabled={isSaving}
            />
            {messages.length > 1 && (
              <button
                type="button"
                onClick={() => removeMessage(i)}
                style={styles.msgRemove}
                aria-label={`Remove message ${i + 1}`}
                disabled={isSaving}
              >
                {XIcon}
              </button>
            )}
          </div>
        ))}

        <button type="button" onClick={addMessage} style={styles.addBtn} disabled={isSaving}>
          {PlusIcon}Add message
        </button>

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
        {isActive && messages.some((m) => m.trim()) && (
          <div style={styles.previewWrap}>
            {messages
              .filter((m) => m.trim())
              .map((m, i) => (
                <div key={i} style={styles.preview}>
                  {MegaphoneIcon}
                  <span>{m}</span>
                </div>
              ))}
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
  card: shared.card,
  title: shared.titleTight,
  subtitle: shared.subtitle,
  error: {
    padding: '11px 14px',
    backgroundColor: 'var(--danger-soft)',
    color: 'var(--danger-text)',
    borderRadius: '9px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  imageSection: {
    marginBottom: '20px',
  },
  fieldLabel: {
    display: 'block',
    fontSize: '12.5px',
    fontWeight: '700' as const,
    color: 'var(--text-muted)',
    marginBottom: '8px',
  },
  imagePreview: {
    display: 'block',
    width: '100%',
    height: '150px',
    objectFit: 'cover' as const,
    borderRadius: '8px',
    marginBottom: '10px',
    backgroundColor: 'var(--border)',
  },
  imagePlaceholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '110px',
    borderRadius: '8px',
    border: '2px dashed var(--border-strong)',
    color: 'var(--text-faint)',
    fontSize: '13px',
    marginBottom: '10px',
  },
  imageHint: {
    fontSize: '12px',
    color: 'var(--text-faint)',
    margin: '0 0 10px',
  },
  imageActions: {
    display: 'flex',
    gap: '10px',
  },
  uploadBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '9px 16px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600' as const,
  },
  divider: {
    border: 'none',
    borderTop: '1px solid var(--border)',
    margin: '20px 0',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '8px',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    marginBottom: '12px',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
  },
  msgRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    marginBottom: '10px',
  },
  msgNum: {
    flexShrink: 0,
    width: '22px',
    height: '22px',
    marginTop: '9px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-soft)',
    color: 'var(--accent-text)',
    fontSize: '12px',
    fontWeight: '600' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgTextarea: {
    flex: 1,
    padding: '11px 13px',
    border: '1px solid var(--border-strong)',
    borderRadius: '8px',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
  },
  msgRemove: {
    flexShrink: 0,
    marginTop: '6px',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: '1px solid var(--border-strong)',
    borderRadius: '7px',
    color: 'var(--danger-text)',
    cursor: 'pointer',
  },
  addBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 14px',
    backgroundColor: 'var(--accent-soft)',
    color: 'var(--accent-text)',
    border: '1px dashed var(--border-dashed)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600' as const,
    marginBottom: '16px',
  },
  previewWrap: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    marginBottom: '16px',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: 'var(--text)',
    marginBottom: '16px',
    cursor: 'pointer',
  },
  preview: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    borderRadius: '8px',
    fontSize: '13.5px',
    fontWeight: '500' as const,
    marginBottom: '16px',
  },
  actions: {
    display: 'flex',
    gap: '10px',
  },
  saveBtn: {
    padding: '10px 20px',
    backgroundColor: 'var(--success)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600' as const,
  },
  clearBtn: {
    padding: '10px 20px',
    backgroundColor: 'var(--neutral)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13.5px',
    fontWeight: '600' as const,
  },
};
