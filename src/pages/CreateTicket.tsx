import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { Location, Tag, Urgency } from '../types';
import { Urgency as UrgencyValues } from '../types';

export function CreateTicket() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationId, setLocationId] = useState('');
  const [urgency, setUrgency] = useState<Urgency>(UrgencyValues.MEDIUM);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFormData();
  }, []);

  async function loadFormData() {
    try {
      const [locRes, tagRes] = await Promise.all([
        api.listLocations(),
        api.listTags(),
      ]);
      setLocations(locRes.data.data?.items || []);
      setTags(tagRes.data.data?.items || []);

      // Set first location as default
      if (locRes.data.data?.items && locRes.data.data.items.length > 0) {
        setLocationId(locRes.data.data.items[0].id);
      }
    } catch (err) {
      setError('Failed to load form data');
      console.error(err);
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setPhotos((prev) => [...prev, ...files]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
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

      photos.forEach((photo) => {
        formData.append('photos', photo);
      });

      const response = await api.createTicket(formData);
      if (response.data.success) {
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

          {/* Photos */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Photos (optional)</label>
            <div style={styles.uploadArea}>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoChange}
                style={styles.fileInput}
                disabled={isLoading}
              />
              <p style={styles.uploadText}>Click to select photos (JPEG, PNG, WebP)</p>
            </div>

            {/* Photo Preview */}
            {photos.length > 0 && (
              <div style={styles.photoGrid}>
                {photos.map((photo, idx) => (
                  <div key={idx} style={styles.photoCard}>
                    <div style={styles.photoName}>{photo.name}</div>
                    <div style={styles.photoSize}>{(photo.size / 1024).toFixed(0)} KB</div>
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      style={styles.removeBtn}
                      disabled={isLoading}
                    >
                      ✕ Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: '20px 40px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
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
    margin: '40px auto',
    padding: '0 20px',
  },
  form: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '32px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  formGroup: {
    marginBottom: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
  },
  textarea: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
    minHeight: '120px',
    resize: 'vertical' as const,
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
  },
  tagGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '8px',
  },
  tagButton: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s',
  },
  tagButtonActive: {
    backgroundColor: '#007bff',
    color: 'white',
    borderColor: '#007bff',
  },
  uploadArea: {
    border: '2px dashed #ddd',
    borderRadius: '4px',
    padding: '32px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  fileInput: {
    display: 'none',
  },
  uploadText: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '12px',
    marginTop: '16px',
  },
  photoCard: {
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '12px',
    textAlign: 'center' as const,
    backgroundColor: '#fafafa',
  },
  photoName: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '4px',
    wordBreak: 'break-word' as const,
  },
  photoSize: {
    fontSize: '11px',
    color: '#999',
    marginBottom: '8px',
  },
  removeBtn: {
    fontSize: '11px',
    color: '#dc3545',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '32px',
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
    flex: 1,
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
    flex: 1,
  },
  error: {
    padding: '12px 16px',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '16px',
  },
};
