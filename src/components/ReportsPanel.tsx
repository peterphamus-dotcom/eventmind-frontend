import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, photoSrc } from '../api';
import { LocationFilter } from './LocationFilter';
import { CollapsibleSection } from './CollapsibleSection';
import { SearchBar } from './SearchBar';
import type { Report, Location } from '../types';

type SortOption = 'recent' | 'location';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Most recent' },
  { value: 'location', label: 'Location' },
];

/** The full report list experience (filters, sort, thumbnails) without a
 *  page header — embeddable in the dashboard or a standalone page. */
export function ReportsPanel() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce the search box so we don't fire a request on every keystroke
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const locationKey = selectedLocationIds.join(',');
  useEffect(() => {
    loadReports();
  }, [sortBy, locationKey, debouncedSearch]);

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
      if (debouncedSearch) params.search = debouncedSearch;

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
    <div>
      {/* Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search reports…"
      />

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
        <p style={styles.empty}>
          {debouncedSearch ? `No reports match “${debouncedSearch}”.` : 'No reports found.'}
        </p>
      ) : (
        <CollapsibleSection title="Reports" count={reports.length} storageKey="reports-all">
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
                    onError={(e) => {
                      // Pre-R2 photos lived on ephemeral disk and are gone
                      e.currentTarget.style.display = 'none';
                    }}
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
                      <span style={styles.metaText}>📷 {report.photos.length}+</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {!isLoading && reports.length > 0 && (
        <p style={styles.count}>
          Showing {reports.length} of {total} report{total === 1 ? '' : 's'}
        </p>
      )}
    </div>
  );
}

const styles = {
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  control: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: '1 1 0',
    minWidth: 0,
  },
  controlLabel: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    fontWeight: '600' as const,
    whiteSpace: 'nowrap' as const,
  },
  sortSelect: {
    flex: 1,
    minWidth: 0,
    padding: '8px 10px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    fontSize: '16px',
  },
  error: {
    padding: '12px 16px',
    backgroundColor: 'var(--danger-bg)',
    color: 'var(--danger-text)',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  loading: {
    color: 'var(--text-muted)',
  },
  empty: {
    fontSize: '14px',
    color: 'var(--text-faint)',
    fontStyle: 'italic',
    padding: '24px 0',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  listItem: {
    backgroundColor: 'var(--surface)',
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
    backgroundColor: 'var(--border)',
  },
  itemBody: {
    minWidth: 0,
    flex: 1,
  },
  itemTitle: {
    fontSize: '14px',
    fontWeight: '600' as const,
    margin: '0 0 8px 0',
    color: 'var(--text)',
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
    color: 'var(--text-muted)',
  },
  count: {
    fontSize: '13px',
    color: 'var(--text-faint)',
    marginTop: '16px',
  },
};
