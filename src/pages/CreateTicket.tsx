import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, photoSrc } from '../api';
import { useToast } from '../Toast';
import { PhotoPicker } from '../components/PhotoPicker';
import { useFormLists } from '../hooks/useFormLists';
import type { Urgency } from '../types';
import { Urgency as UrgencyValues } from '../types';

export function CreateTicket() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { locations, tags, loadError, reload } = useFormLists();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationId, setLocationId] = useState('');
  const [urgency, setUrgency] = useState<Urgency>(UrgencyValues.MEDIUM);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [pin, setPin] = useState<{ x: number; y: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default to the first location once loaded
  useEffect(() => {
    if (!locationId && locations.length > 0) {
      setLocationId(locations[0].id);
    }
  }, [locations, locationId]);

  // A pin only makes sense on the floorplan it was dropped on
  useEffect(() => {
    setPin(null);
  }, [locationId]);

  const selectedLocation = locations.find((loc) => loc.id === locationId);

  function handleFloorplanClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    setPin({ x, y });
  }

  function toggleTag(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Ticket title is required');
      return;
    }

    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    if (!locationId) {
      setError('Location is required');
      return;
    }

    if (selectedTags.length === 0) {
      setError('At least one tag is required');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('locationId', locationId);
      formData.append('urgency', urgency);
      formData.append('tagIds', JSON.stringify(selectedTags));

      if (pin) {
        formData.append('pinX', String(pin.x));
        formData.append('pinY', String(pin.y));
      }

      photos.forEach((photo) => {
        formData.append('photos', photo);
      });

      const response = await api.createTicket(formData);
      if (response.data.success) {
        showToast('Ticket created ✓');
        navigate(`/tickets/${response.data.data?.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create ticket');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
          ← Back to Dashboard
        </button>
        <h1 style={styles.title}>Create Ticket</h1>
      </div>

      {/* Form */}
      <div style={styles.formContainer}>
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}

          {/* Title */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={styles.input}
              placeholder="Brief ticket title..."
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={styles.textarea}
              placeholder="Detailed description of the ticket..."
              disabled={isLoading}
            />
          </div>

          {/* Location and Urgency Row */}
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Location *</label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                style={styles.select}
                disabled={isLoading}
              >
                <option value="">Select a location...</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
              {loadError && locations.length === 0 && (
                <p style={styles.loadWarning}>
                  Couldn't load locations — check your connection.{' '}
                  <button type="button" onClick={reload} style={styles.retryBtn}>
                    Retry
                  </button>
                </p>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Urgency *</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as Urgency)}
                style={styles.select}
                disabled={isLoading}
              >
                {Object.values(UrgencyValues).map((urg) => (
                  <option key={urg} value={urg}>
                    {urg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Tags (select at least one) *</label>
            <div style={styles.tagGrid}>
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  style={{
                    ...styles.tagButton,
                    ...(selectedTags.includes(tag.id) ? styles.tagButtonActive : {}),
                  }}
                  disabled={isLoading}
                >
                  {selectedTags.includes(tag.id) && '✓ '}
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* Floorplan pin */}
          {selectedLocation?.floorplanUrl && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Pin exact location (optional)</label>
              <p style={styles.pinHint}>Tap the floorplan to mark exactly where this is.</p>
              <div style={styles.floorplanWrap} onClick={handleFloorplanClick}>
                <img
                  src={photoSrc(selectedLocation.floorplanUrl)}
                  alt={`${selectedLocation.name} floorplan`}
                  style={styles.floorplanImg}
                />
                {pin && (
                  <div
                    style={{
                      ...styles.pinMarker,
                      left: `${pin.x * 100}%`,
                      top: `${pin.y * 100}%`,
                    }}
                  >
                    📍
                  </div>
                )}
              </div>
              {pin && (
                <button
                  type="button"
                  onClick={() => setPin(null)}
                  style={styles.clearPinBtn}
                  disabled={isLoading}
                >
                  Clear pin
                </button>
              )}
            </div>
          )}

          {/* Photos */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Photos (optional)</label>
            <PhotoPicker photos={photos} onChange={setPhotos} disabled={isLoading} />
          </div>

          {/* Buttons */}
          <div style={styles.actions}>
            <button
              type="submit"
              style={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Ticket'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              style={styles.cancelBtn}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: 'var(--bg)',
  },
  header: {
    backgroundColor: 'var(--surface)',
    padding: '16px clamp(16px, 4vw, 40px)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },
  backBtn: {
    fontSize: '14px',
    color: '#007bff',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500' as const,
    padding: 0,
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: 0,
  },
  formContainer: {
    maxWidth: '800px',
    margin: 'clamp(16px, 4vw, 40px) auto',
    padding: '0 clamp(12px, 3vw, 20px)',
  },
  form: {
    backgroundColor: 'var(--surface)',
    borderRadius: '8px',
    padding: 'clamp(16px, 4vw, 32px)',
    boxShadow: '0 2px 10px var(--shadow)',
  },
  formGroup: {
    marginBottom: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text)',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
  },
  textarea: {
    padding: '12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
    minHeight: '120px',
    resize: 'vertical' as const,
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
  },
  select: {
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
  },
  tagGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '8px',
  },
  tagButton: {
    padding: '8px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s',
  },
  tagButtonActive: {
    backgroundColor: '#007bff',
    color: 'white',
    borderColor: '#007bff',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '32px',
    flexWrap: 'wrap' as const,
  },
  submitBtn: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500' as const,
    flex: '1 1 140px',
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500' as const,
    flex: '1 1 140px',
  },
  error: {
    padding: '12px 16px',
    backgroundColor: 'var(--danger-bg)',
    color: 'var(--danger-text)',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  pinHint: {
    fontSize: '13px',
    color: 'var(--text-faint)',
    margin: '0 0 4px 0',
  },
  floorplanWrap: {
    position: 'relative' as const,
    display: 'inline-block',
    maxWidth: '100%',
    cursor: 'crosshair',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  floorplanImg: {
    display: 'block',
    maxWidth: '100%',
    width: '100%',
    userSelect: 'none' as const,
  },
  pinMarker: {
    position: 'absolute' as const,
    transform: 'translate(-50%, -100%)',
    fontSize: '28px',
    pointerEvents: 'none' as const,
    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
  },
  clearPinBtn: {
    marginTop: '8px',
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '13px',
    alignSelf: 'flex-start',
  },
  loadWarning: {
    fontSize: '13px',
    color: 'var(--danger-text)',
    margin: 0,
  },
  retryBtn: {
    fontSize: '13px',
    color: '#007bff',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600' as const,
    padding: 0,
    textDecoration: 'underline',
    minHeight: 'auto',
  },
};
