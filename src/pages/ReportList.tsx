import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, photoSrc } from '../api';
import { LocationFilter } from '../components/LocationFilter';
import type { Report, Location } from '../types';

type SortOption = 'recent' | 'location';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Most recent' },
  { value: 'location', label: 'Location' },
];

export function ReportList() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const locationKey = selectedLocationIds.join(',');
  useEffect(() => {
    loadReports();
  }, [sortBy, locationKey]);

  useEffect(() => {
    api
      .listLocations()
      .then((res) => setLocations(res.data.data?.items || []))
      .catch(() => setLocations([]));
  }, []);

  async function loadReports() {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (sortBy === 'location') params.sortBy = 'location';
      if (selectedLocationIds.length > 0) params.locationId = selectedLocationIds.join(',');

      const response = await api.listReports(1, 100, params);
      setReports(response.data.data?.items || []);
      setTotal(response.data.data?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load reports');
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
        <h1 style={styles.title}>All Reports</h1>
      </div>

      <div style={styles.content}>
        {/* Controls */}
        <div style={styles.controls}>
          <div style={styles.control}>
            <label style={styles.controlLabel}>Locations</label>
            <LocationFilter
              locations={locations}
              selectedIds={selectedLocationIds}
              onChange={setSelectedLocationIds}
            />
          </div>
          <div style={styles.control}>
            <label style={styles.controlLabel}>Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              style={styles.sortSelect}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* List */}
        {isLoading ? (
          <p style={styles.loading}>Loading reports...</p>
        ) : reports.length === 0 ? (
          <p style={styles.empty}>No reports found.</p>
        ) : (
          <div style={styles.list}>
            {reports.map((report) => (
              <div
                key={report.id}
                onClick={() => navigate(`/reports/${report.id}`)}
                style={styles.listItem}
              >
                {report.photos && report.photos.length > 0 && (
                  <img
                    src={photoSrc(report.photos[0].url)}
                    alt=""
                    loading="lazy"
                    style={styles.thumb}
                  />
                )}
                <div style={styles.itemBody}>
                  <h3 style={styles.itemTitle}>{report.text}</h3>
                  <div style={styles.itemMeta}>
                    <span style={styles.metaText}>📍 {report.location?.name}</span>
                    <span style={styles.metaText}>By {report.submitter?.name}</span>
                    <span style={styles.metaText}>
                      {new Date(report.submittedAt).toLocaleDateString()}
                    </span>
                    {report.photos && report.photos.length > 1 && (
                      <span style={styles.metaText}>
                        📷 {report.photos.length}+
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && reports.length > 0 && (
          <p style={styles.count}>
            Showing {reports.length} of {total} report{total === 1 ? '' : 's'}
          </p>
        )}
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
    padding: '16px clamp(16px, 4vw, 40px)',
    borderBottom: '1px solid #eee',
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
    fontSize: 'clamp(18px, 5vw, 24px)',
    fontWeight: 'bold',
    margin: 0,
  },
  content: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: 'clamp(16px, 4vw, 32px)',
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap' as const,
    marginBottom: '20px',
  },
  control: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  controlLabel: {
    fontSize: '13px',
    color: '#666',
    fontWeight: '600' as const,
    whiteSpace: 'nowrap' as const,
  },
  sortSelect: {
    padding: '8px 10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: 'white',
  },
  error: {
    padding: '12px 16px',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  loading: {
    color: '#666',
  },
  empty: {
    fontSize: '14px',
    color: '#999',
    fontStyle: 'italic',
    padding: '24px 0',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  listItem: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  thumb: {
    width: '56px',
    height: '56px',
    objectFit: 'cover' as const,
    borderRadius: '6px',
    flexShrink: 0,
    backgroundColor: '#eee',
  },
  itemBody: {
    minWidth: 0,
    flex: 1,
  },
  itemTitle: {
    fontSize: '14px',
    fontWeight: '600' as const,
    margin: '0 0 8px 0',
    color: '#333',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
  },
  itemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  metaText: {
    fontSize: '12px',
    color: '#666',
  },
  count: {
    fontSize: '13px',
    color: '#999',
    marginTop: '16px',
  },
};
