import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, photoSrc } from '../api';
import { useToast } from '../Toast';
import { PhotoPicker } from '../components/PhotoPicker';
import { useFormLists } from '../hooks/useFormLists';
import { FormPage, MapPinFilled, styles } from '../components/FormPage';
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
    <FormPage title="Create Ticket" onSubmit={handleSubmit}>
      {error && <div style={styles.error}>{error}</div>}

        {/* Title */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.input}
            placeholder="Brief ticket title…"
            disabled={isLoading}
          />
        </div>

        {/* Description */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ ...styles.textarea, minHeight: '100px' }}
            rows={4}
            placeholder="Detailed description of the ticket…"
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
              <option value="">Select a location…</option>
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
            <p style={localStyles.pinHint}>Tap the floorplan to mark exactly where this is.</p>
            <div style={localStyles.floorplanWrap} onClick={handleFloorplanClick}>
              <img
                src={photoSrc(selectedLocation.floorplanUrl)}
                alt={`${selectedLocation.name} floorplan`}
                style={localStyles.floorplanImg}
              />
              {pin && (
                <div
                  style={{
                    ...localStyles.pinMarker,
                    left: `${pin.x * 100}%`,
                    top: `${pin.y * 100}%`,
                  }}
                >
                  <MapPinFilled />
                </div>
              )}
            </div>
            {pin && (
              <button
                type="button"
                onClick={() => setPin(null)}
                style={localStyles.clearPinBtn}
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
        <button type="submit" style={styles.submitBtn} disabled={isLoading}>
          {isLoading ? 'Creating…' : 'Create Ticket'}
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
    </FormPage>
  );
}

const localStyles: Record<string, React.CSSProperties> = {
  pinHint: {
    fontSize: '12px',
    color: 'var(--text-faint)',
    margin: 0,
  },
  floorplanWrap: {
    position: 'relative',
    display: 'inline-block',
    maxWidth: '100%',
    width: '100%',
    cursor: 'crosshair',
    border: '1px solid var(--border-strong)',
    borderRadius: '9px',
    overflow: 'hidden',
  },
  floorplanImg: {
    display: 'block',
    maxWidth: '100%',
    width: '100%',
    userSelect: 'none',
  },
  pinMarker: {
    position: 'absolute',
    transform: 'translate(-50%, -100%)',
    pointerEvents: 'none',
    filter: 'drop-shadow(0 1px 2px oklch(0% 0 0 / 0.5))',
  },
  clearPinBtn: {
    marginTop: '8px',
    padding: '6px 13px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-strong)',
    borderRadius: '7px',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '12.5px',
    alignSelf: 'flex-start',
  },
};
