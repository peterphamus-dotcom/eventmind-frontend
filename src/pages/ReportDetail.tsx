import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api, photoSrc } from '../api';
import { useToast } from '../Toast';
import { CommentsSection } from '../components/CommentsSection';
import { ReactionBar } from '../components/ReactionBar';
import { DetailPage, DetailSection, DetailRow, BellIcon, styles } from '../components/DetailPage';
import type { Report } from '../types';

export function ReportDetail() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { reportId } = useParams<{ reportId: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

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

  async function handleSubscribeToggle() {
    if (!report || isUpdating) return;
    const nowSubscribed = !report.isSubscribed;
    setIsUpdating(true);
    try {
      await api.subscribeReport(report.id);
      setReport({ ...report, isSubscribed: nowSubscribed });
      showToast(nowSubscribed ? 'Subscribed to updates' : 'Unsubscribed');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update subscription');
    } finally {
      setIsUpdating(false);
    }
  }

  if (isLoading) return <div style={styles.loading}>Loading…</div>;
  if (error) return <div style={styles.error}>{error}</div>;
  if (!report) return <div style={styles.error}>Report not found</div>;

  return (
    <DetailPage title="Report Details">
      {/* Main Info */}
      <DetailSection>
        <h2 style={styles.leadTitle}>Report</h2>
        <p style={styles.bodyText}>{report.text}</p>
        <div style={styles.reactionRow}>
          <ReactionBar
            reactions={report.reactions || []}
            onToggle={async (emoji) => {
              const res = await api.toggleReportReaction(report.id, emoji);
              return res.data.data!.reactions;
            }}
          />
          <button
            onClick={handleSubscribeToggle}
            style={{
              ...styles.subscribeBtn,
              ...(report.isSubscribed ? styles.subscribeBtnActive : {}),
            }}
            disabled={isUpdating}
            title="Get notified about activity on this report"
          >
            {BellIcon}
            {report.isSubscribed ? 'Subscribed' : 'Subscribe'}
          </button>
        </div>
      </DetailSection>

      {/* Metadata */}
      <DetailSection title="Details">
        <div style={styles.details}>
          <DetailRow label="Location">{report.location?.name || 'Unknown'}</DetailRow>
          <DetailRow label="Reported by">
            {report.submitter?.id ? (
              <Link to={`/users/${report.submitter.id}`} style={styles.userLink}>
                {report.submitter.name}
              </Link>
            ) : (
              report.submitter?.name
            )}{' '}
            ({report.submitter?.email})
          </DetailRow>
          <DetailRow label="Reported at">
            {new Date(report.submittedAt).toLocaleString()}
          </DetailRow>
          <DetailRow label="Outside home location">
            {report.isOutsideHomeLocation ? 'Yes' : 'No'}
          </DetailRow>
        </div>
      </DetailSection>

      {/* Tags */}
      {report.tags && report.tags.length > 0 && (
        <DetailSection title="Tags">
          <div style={styles.tags}>
            {report.tags.map((tag) => (
              <span key={tag.id} style={styles.tag}>
                {tag.name}
              </span>
            ))}
          </div>
        </DetailSection>
      )}

      {/* Photos */}
      {report.photos && report.photos.length > 0 && (
        <DetailSection title={`Photos (${report.photos.length})`}>
          <div style={styles.photoGrid}>
            {report.photos.map((photo) => (
              <div key={photo.id}>
                <img
                  src={photoSrc(photo.url)}
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
        </DetailSection>
      )}

      {/* Comments */}
      <CommentsSection
        initialComments={report.comments || []}
        onAdd={async (text) => {
          const res = await api.addReportComment(report.id, text);
          return res.data.data!;
        }}
        onReact={async (commentId, emoji) => {
          const res = await api.toggleReportCommentReaction(report.id, commentId, emoji);
          return res.data.data!.reactions;
        }}
      />

      {/* Action Buttons */}
      <div style={styles.actions}>
        <button onClick={() => navigate('/reports/new')} style={styles.primaryBtn}>
          + New Report
        </button>
        <button onClick={() => navigate('/dashboard')} style={styles.secondaryBtn}>
          Back to Dashboard
        </button>
      </div>
    </DetailPage>
  );
}
