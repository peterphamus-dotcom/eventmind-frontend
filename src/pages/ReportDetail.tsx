import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { Report } from '../types';

export function ReportDetail() {
  const navigate = useNavigate();
  const { reportId } = useParams<{ reportId: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, [reportId]);

  async function loadReport() {
    if (!reportId) return;
    setIsLoading(true);
    try {
      const response = await api.getReport(reportId);
      setReport(response.data.data || null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load report');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) return <div style={styles.loading}>Loading...</div>;
  if (error) return <div style={styles.error}>{error}</div>;
  if (!report) return <div style={styles.error}>Report not found</div>;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
          ← Back to Dashboard
        </button>
        <h1 style={styles.title}>Report Details</h1>
      </div>

      {/* Content */}
      <div style={styles.content}>
        <div style={styles.card}>
          {/* Main Info */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Report</h2>
            <p style={styles.text}>{report.text}</p>
          </div>

          {/* Metadata */}
          <div style={styles.section}>
            <h3 style={styles.subtitle}>Details</h3>
            <div style={styles.details}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Location:</span>
                <span>{report.location?.name || 'Unknown'}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Reported by:</span>
                <span>{report.submitter?.name} ({report.submitter?.email})</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Reported at:</span>
                <span>{new Date(report.submittedAt).toLocaleString()}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Outside home location:</span>
                <span>{report.isOutsideHomeLocation ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {report.tags && report.tags.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.subtitle}>Tags</h3>
              <div style={styles.tags}>
                {report.tags.map((tag) => (
                  <span key={tag.id} style={styles.tag}>
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Photos */}
          {report.photos && report.photos.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.subtitle}>Photos ({report.photos.length})</h3>
              <div style={styles.photoGrid}>
                {report.photos.map((photo) => (
                  <div key={photo.id} style={styles.photoContainer}>
                    <img
                      src={`http://localhost:3000${photo.url}`}
                      alt={photo.caption || 'Report photo'}
                      style={styles.photo}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="%23999"%3EPhoto unavailable%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    {photo.caption && <p style={styles.photoCaption}>{photo.caption}</p>}
                    <p style={styles.photoDate}>{new Date(photo.uploadedAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={styles.actions}>
            <button onClick={() => navigate('/reports/new')} style={styles.primaryBtn}>
              + New Report
            </button>
            <button onClick={() => navigate('/dashboard')} style={styles.secondaryBtn}>
              Back to Dashboard
            </button>
          </div>
        </div>
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
    fontWeight: '500',
    padding: 0,
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: 0,
  },
  content: {
    maxWidth: '900px',
    margin: '40px auto',
    padding: '0 20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '32px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  section: {
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '1px solid #eee',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#333',
    margin: '0 0 16px 0',
  },
  subtitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#333',
    margin: '0 0 12px 0',
  },
  text: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#555',
    margin: 0,
    whiteSpace: 'pre-wrap' as const,
  },
  details: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  detailRow: {
    display: 'flex',
    gap: '16px',
    fontSize: '14px',
  },
  detailLabel: {
    fontWeight: '600',
    color: '#333',
    minWidth: '150px',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
  },
  tag: {
    display: 'inline-block',
    padding: '6px 12px',
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    borderRadius: '16px',
    fontSize: '13px',
    fontWeight: '500',
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
  },
  photoContainer: {
    borderRadius: '4px',
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  photo: {
    width: '100%',
    height: '200px',
    objectFit: 'cover' as const,
    display: 'block',
  },
  photoCaption: {
    fontSize: '12px',
    color: '#666',
    padding: '8px 12px',
    margin: 0,
  },
  photoDate: {
    fontSize: '11px',
    color: '#999',
    padding: '0 12px 8px 12px',
    margin: 0,
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
  primaryBtn: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    flex: 1,
  },
  secondaryBtn: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    flex: 1,
  },
  loading: {
    padding: '20px',
    fontSize: '16px',
    color: '#666',
  },
  error: {
    padding: '20px',
    fontSize: '16px',
    color: '#c00',
    backgroundColor: '#fee',
  },
};
