import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../Toast';
import { PhotoPicker } from '../components/PhotoPicker';
import { useFormLists } from '../hooks/useFormLists';
import { FormPage, styles } from '../components/FormPage';

export function CreateReport() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { locations, tags, loadError, reload } = useFormLists();
  const [text, setText] = useState('');
  const [locationId, setLocationId] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default to the first location once loaded
  useEffect(() => {
    if (!locationId && locations.length > 0) {
      setLocationId(locations[0].id);
    }
  }, [locations, locationId]);

  function toggleTag(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!text.trim()) {
      setError('Report text is required');
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

    if (photos.length === 0) {
      setError('At least one photo is required');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('locationId', locationId);
      formData.append('tagIds', JSON.stringify(selectedTags));

      photos.forEach((photo) => {
        formData.append('photos', photo);
      });

      const response = await api.createReport(formData);
      if (response.data.success) {
        showToast('Report submitted ✓');
        navigate(`/reports/${response.data.data?.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create report');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <FormPage title="Report an Issue" onSubmit={handleSubmit}>
      {error && <div style={styles.error}>{error}</div>}

      {/* Description */}
      <div style={styles.formGroup}>
        <label style={styles.label}>What happened? *</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ ...styles.textarea, minHeight: '100px' }}
          rows={4}
          placeholder="Describe the issue in detail…"
          disabled={isLoading}
        />
      </div>

      {/* Location */}
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

      {/* Photos */}
      <div style={styles.formGroup}>
        <label style={styles.label}>Photos (at least one) *</label>
        <PhotoPicker photos={photos} onChange={setPhotos} disabled={isLoading} />
      </div>

      {/* Buttons */}
      <div style={styles.actions}>
        <button type="submit" style={styles.submitBtn} disabled={isLoading}>
          {isLoading ? 'Submitting…' : 'Submit Report'}
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
