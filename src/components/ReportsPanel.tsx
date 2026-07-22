import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, photoSrc } from '../api';
import { useAuth } from '../AuthContext';
import { LocationFilter } from './LocationFilter';
import { CollapsibleSection } from './CollapsibleSection';
import { SearchBar } from './SearchBar';
import {
  LocationIcon,
  PlusIcon,
  SortIcon,
  MapPinOutlineIcon,
  addCardStyle,
} from './badges';
import type { Report, Location } from '../types';

const CameraIcon = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

type SortOption = 'recent' | 'location';

const DEFAULT_VISIBLE_COUNT = 10;

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Most recent' },
  { value: 'location', label: 'Location' },
];

/** The full report list experience (filters, sort, thumbnails) without a
 *  page header — embeddable in the dashboard or a standalone page. */
export function ReportsPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCompact = user?.viewDensity === 'COMPACT';
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  // Debounce the search box so we don't fire a request on every keystroke
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const locationKey = selectedLocationIds.join(',');
  useEffect(() => {
    loadReports();
    setShowAll(false);
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
      {/* Add new */}
      <div onClick={() => navigate('/reports/new')} style={addCardStyle}>
        <PlusIcon />
        Report Issue
      </div>

      {/* Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search reports…"
      />

      {/* Controls */}
      <div style={styles.controls}>
        <div style={styles.control}>
          <span style={styles.controlLabel} aria-label="Locations" title="Locations">
            <MapPinOutlineIcon />
          </span>
          <LocationFilter
            locations={locations}
            selectedIds={selectedLocationIds}
            onChange={setSelectedLocationIds}
          />
        </div>
        <div style={styles.control}>
          <span style={styles.controlLabel} aria-label="Sort by" title="Sort by">
            <SortIcon />
          </span>
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
            {(showAll ? reports : reports.slice(0, DEFAULT_VISIBLE_COUNT)).map((report) => (
              <div
                key={report.id}
                onClick={() => navigate(`/reports/${report.id}`)}
                style={{ ...styles.listItem, ...(isCompact ? styles.listItemCompact : {}) }}
              >
                {!isCompact && report.photos && report.photos.length > 0 && (
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
                  <h3 style={{ ...styles.itemTitle, ...(isCompact ? styles.itemTitleCompact : {}) }}>
                    {report.text}
                  </h3>
                  <div style={{ ...styles.itemMeta, ...(isCompact ? styles.itemMetaCompact : {}) }}>
                    <span style={styles.metaText}>
                      <LocationIcon />
                      {report.location?.name}
                    </span>
                    <span style={styles.metaText}>By {report.submitter?.name}</span>
                    <span style={styles.metaText}>
                      {new Date(report.submittedAt).toLocaleDateString()}
                    </span>
                    {report.photos && report.photos.length > 1 && (
                      <span style={styles.metaText}>
                        {CameraIcon}
                        {report.photos.length}+
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {!showAll && reports.length > DEFAULT_VISIBLE_COUNT && (
            <button onClick={() => setShowAll(true)} style={styles.showAllBtn}>
              Show all ({reports.length - DEFAULT_VISIBLE_COUNT} more)
            </button>
          )}
        </CollapsibleSection>
      )}

      {!isLoading && reports.length > 0 && (
        <p style={styles.count}>
          Showing {showAll ? reports.length : Math.min(reports.length, DEFAULT_VISIBLE_COUNT)} of {total} report{total === 1 ? '' : 's'}
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
    flexWrap: 'wrap' as const,
  },
  control: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: '1 1 180px',
    minWidth: '160px',
  },
  controlLabel: {
    display: 'flex',
    flexShrink: 0,
  },
  sortSelect: {
    flex: 1,
    minWidth: 0,
    padding: '9px 11px',
    border: '1px solid var(--border-strong)',
    borderRadius: '8px',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    fontSize: '14px',
  },
  error: {
    padding: '12px 16px',
    backgroundColor: 'var(--danger-soft)',
    color: 'var(--danger-text)',
    borderRadius: '9px',
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
    padding: '28px 0',
    textAlign: 'center' as const,
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  listItem: {
    backgroundColor: 'var(--surface)',
    padding: '15px 16px',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  listItemCompact: {
    padding: '9px 13px',
  },
  thumb: {
    width: '56px',
    height: '56px',
    objectFit: 'cover' as const,
    borderRadius: '8px',
    flexShrink: 0,
    backgroundColor: 'var(--border)',
  },
  itemBody: {
    minWidth: 0,
    flex: 1,
  },
  itemTitle: {
    fontSize: '14.5px',
    fontWeight: '600' as const,
    margin: '0 0 8px 0',
    color: 'var(--text)',
    lineHeight: 1.4,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
  },
  itemTitleCompact: {
    margin: '0 0 4px 0',
    display: 'block',
    WebkitLineClamp: 'unset',
    whiteSpace: 'nowrap' as const,
    textOverflow: 'ellipsis',
  },
  itemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  itemMetaCompact: {
    flexWrap: 'nowrap' as const,
    overflow: 'hidden',
  },
  metaText: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
  },
  count: {
    fontSize: '12.5px',
    color: 'var(--text-faint)',
    marginTop: '18px',
  },
  showAllBtn: {
    display: 'block',
    width: '100%',
    padding: '10px',
    marginTop: '8px',
    backgroundColor: 'transparent',
    border: '1px dashed var(--border-dashed)',
    borderRadius: '9px',
    color: 'var(--accent)',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600' as const,
  },
};
