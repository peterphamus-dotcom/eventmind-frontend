import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, photoSrc } from '../api';
import { useAuth } from '../AuthContext';
import { useToast } from '../Toast';
import { CommentsSection } from '../components/CommentsSection';
import { ReactionBar } from '../components/ReactionBar';
import type { Ticket, TicketStatus, Urgency } from '../types';
import { TicketStatus as TicketStatusValues, Urgency as UrgencyValues } from '../types';

export function TicketDetail() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const showToast = useToast();
  const { ticketId } = useParams<{ ticketId: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const isAdminOrCore = user?.role === 'ADMIN' || user?.role === 'CORE_TEAM';
  const canUpdateUrgency = isAdminOrCore;
  const isCreator = ticket?.submitterId === user?.id;

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  async function loadTicket() {
    if (!ticketId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getTicket(ticketId);
      setTicket(response.data.data || null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load ticket');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!ticket || isUpdating) return;
    setIsUpdating(true);
    setUpdateError(null);
    try {
      const response = await api.updateTicket(ticket.id, newStatus);
      setTicket(response.data.data || null);
      if (newStatus === 'RESOLVED') {
        showToast('Ticket marked as resolved ✓');
      }
    } catch (err: any) {
      setUpdateError(err.response?.data?.error || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleUrgencyChange(newUrgency: string) {
    if (!ticket || isUpdating) return;
    setIsUpdating(true);
    setUpdateError(null);
    try {
      const response = await api.updateTicket(ticket.id, undefined, newUrgency);
      setTicket(response.data.data || null);
    } catch (err: any) {
      setUpdateError(err.response?.data?.error || 'Failed to update urgency');
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleGlobalPin() {
    if (!ticket || isUpdating) return;
    setIsUpdating(true);
    setUpdateError(null);
    try {
      await api.pinTicket(ticket.id);
      setTicket({ ...ticket, isPinnedGlobal: !ticket.isPinnedGlobal });
    } catch (err: any) {
      setUpdateError(err.response?.data?.error || 'Failed to update pin');
    } finally {
      setIsUpdating(false);
    }
  }

  async function handlePersonalPin() {
    if (!ticket || isUpdating) return;
    const nowSaved = !ticket.userHasPersonalPin;
    setIsUpdating(true);
    setUpdateError(null);
    try {
      await api.pinTicketPersonal(ticket.id);
      setTicket({ ...ticket, userHasPersonalPin: nowSaved });
      showToast(nowSaved ? 'Saved to Dashboard' : 'Removed from Dashboard');
    } catch (err: any) {
      setUpdateError(err.response?.data?.error || 'Failed to update');
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleSubscribeToggle() {
    if (!ticket || isUpdating) return;
    const nowSubscribed = !ticket.isSubscribed;
    setIsUpdating(true);
    setUpdateError(null);
    try {
      await api.subscribeTicket(ticket.id);
      setTicket({ ...ticket, isSubscribed: nowSubscribed });
      showToast(nowSubscribed ? 'Subscribed to updates' : 'Unsubscribed');
    } catch (err: any) {
      setUpdateError(err.response?.data?.error || 'Failed to update subscription');
    } finally {
      setIsUpdating(false);
    }
  }

  const urgencyColor = (urgency: Urgency) => {
    switch (urgency) {
      case 'HIGH':
        return '#dc3545';
      case 'MEDIUM':
        return '#ffc107';
      case 'LOW':
        return '#28a745';
      default:
        return '#666';
    }
  };

  const statusColor = (status: TicketStatus) => {
    switch (status) {
      case 'OPEN':
        return '#007bff';
      case 'IN_PROGRESS':
        return '#ffc107';
      case 'RESOLVED':
        return '#28a745';
      case 'ARCHIVED':
        return '#6c757d';
      default:
        return '#999';
    }
  };

  if (isLoading) return <div style={styles.loading}>Loading...</div>;
  if (error) return <div style={styles.error}>{error}</div>;
  if (!ticket) return <div style={styles.error}>Ticket not found</div>;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
          ← Back to Dashboard
        </button>
        <h1 style={styles.title}>Ticket Details</h1>
      </div>

      {/* Content */}
      <div style={styles.content}>
        <div style={styles.card}>
          {updateError && <div style={styles.updateError}>{updateError}</div>}

          {/* Title and Status Row */}
          <div style={styles.titleRow}>
            <div>
              <h2 style={styles.ticketTitle}>{ticket.title}</h2>
              <p style={styles.ticketDescription}>{ticket.description}</p>
              <div style={{ marginTop: '12px' }}>
                <ReactionBar
                  reactions={ticket.reactions || []}
                  onToggle={async (emoji) => {
                    const res = await api.toggleTicketReaction(ticket.id, emoji);
                    return res.data.data!.reactions;
                  }}
                />
              </div>
            </div>
          </div>

          {/* Status, Urgency and Pins Row */}
          <div style={styles.controlRow}>
            <div style={styles.leftControls}>
              <div style={styles.statusControl}>
                <label style={styles.label}>Status</label>
                {isAdminOrCore ? (
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    style={{
                      ...styles.statusSelect,
                      borderColor: statusColor(ticket.status as TicketStatus),
                    }}
                    disabled={isUpdating}
                  >
                    {Object.values(TicketStatusValues).map((status) => (
                      <option key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: statusColor(ticket.status as TicketStatus),
                    }}
                  >
                    {ticket.status.replace(/_/g, ' ')}
                  </div>
                )}
                {!isAdminOrCore && isCreator && ticket.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleStatusChange('RESOLVED')}
                    style={styles.resolveBtn}
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Updating…' : '✓ Mark as Resolved'}
                  </button>
                )}
              </div>
              <div style={styles.urgencyControl}>
                <label style={styles.label}>Urgency</label>
              {canUpdateUrgency ? (
                <select
                  value={ticket.urgency}
                  onChange={(e) => handleUrgencyChange(e.target.value)}
                  style={{
                    ...styles.urgencySelect,
                    borderColor: urgencyColor(ticket.urgency as Urgency),
                  }}
                  disabled={isUpdating}
                >
                  {Object.values(UrgencyValues).map((urg) => (
                    <option key={urg} value={urg}>
                      {urg}
                    </option>
                  ))}
                </select>
              ) : (
                <div
                  style={{
                    ...styles.urgencyBadge,
                    backgroundColor: urgencyColor(ticket.urgency as Urgency),
                  }}
                >
                  {ticket.urgency}
                </div>
              )}
              </div>
            </div>

            <div style={styles.pinControls}>
              <button
                onClick={handleSubscribeToggle}
                style={{
                  ...styles.pinBtn,
                  ...(ticket.isSubscribed ? styles.pinBtnActive : {}),
                }}
                disabled={isUpdating}
                title="Get notified about activity on this ticket"
              >
                {ticket.isSubscribed ? '🔔 Subscribed' : '🔕 Subscribe'}
              </button>
              <button
                onClick={handlePersonalPin}
                style={{
                  ...styles.pinBtn,
                  ...(ticket.userHasPersonalPin ? styles.pinBtnActive : {}),
                }}
                disabled={isUpdating}
                title="Save to your dashboard"
              >
                {ticket.userHasPersonalPin ? '⭐ Saved' : '☆ Save'}
              </button>
              {(user?.role === 'ADMIN' || user?.role === 'CORE_TEAM') && (
                <button
                  onClick={handleGlobalPin}
                  style={{
                    ...styles.pinBtn,
                    ...(ticket.isPinnedGlobal ? styles.pinBtnActive : {}),
                  }}
                  disabled={isUpdating}
                  title="Pin for everyone"
                >
                  {ticket.isPinnedGlobal ? '📌' : '📍'} Global
                </button>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div style={styles.section}>
            <h3 style={styles.subtitle}>Details</h3>
            <div style={styles.details}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Location:</span>
                <span>{ticket.location?.name || 'Unknown'}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Reported by:</span>
                <span>
                  {ticket.submitter?.name} ({ticket.submitter?.email})
                  {isCreator && <span style={styles.creatorBadge}> (You)</span>}
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Created at:</span>
                <span>{new Date(ticket.createdAt).toLocaleString()}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Updated at:</span>
                <span>{new Date(ticket.updatedAt).toLocaleString()}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Outside home location:</span>
                <span>{ticket.isOutsideHomeLocation ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {ticket.tags && ticket.tags.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.subtitle}>Tags</h3>
              <div style={styles.tags}>
                {ticket.tags.map((tag) => (
                  <span key={tag.id} style={styles.tag}>
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Photos */}
          {ticket.photos && ticket.photos.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.subtitle}>Photos ({ticket.photos.length})</h3>
              <div style={styles.photoGrid}>
                {ticket.photos.map((photo) => (
                  <div key={photo.id} style={styles.photoContainer}>
                    <img
                      src={photoSrc(photo.url)}
                      alt={photo.caption || 'Ticket photo'}
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

          {/* Urgency Audit Trail */}
          {ticket.urgencyAudits && ticket.urgencyAudits.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.subtitle}>Urgency History</h3>
              <div style={styles.auditTrail}>
                {ticket.urgencyAudits.map((audit) => (
                  <div key={audit.id} style={styles.auditEntry}>
                    <div style={styles.auditTime}>
                      {new Date(audit.changedAt).toLocaleString()}
                    </div>
                    <div style={styles.auditChange}>
                      {audit.changedBy.name} changed urgency from{' '}
                      <span style={styles.auditFrom}>
                        {audit.fromUrgency || 'UNSET'}
                      </span>{' '}
                      to{' '}
                      <span style={styles.auditTo}>{audit.toUrgency}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <CommentsSection
            initialComments={ticket.comments || []}
            onAdd={async (text) => {
              const res = await api.addTicketComment(ticket.id, text);
              return res.data.data!;
            }}
            onReact={async (commentId, emoji) => {
              const res = await api.toggleTicketCommentReaction(ticket.id, commentId, emoji);
              return res.data.data!.reactions;
            }}
          />

          {/* Action Buttons */}
          <div style={styles.actions}>
            <button onClick={() => navigate('/tickets/new')} style={styles.primaryBtn}>
              + New Ticket
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
    backgroundColor: 'var(--bg)',
  },
  header: {
    backgroundColor: 'var(--surface)',
    padding: '20px 40px',
    borderBottom: '1px solid var(--border)',
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
  content: {
    maxWidth: '900px',
    margin: '40px auto',
    padding: '0 20px',
  },
  card: {
    backgroundColor: 'var(--surface)',
    borderRadius: '8px',
    padding: '32px',
    boxShadow: '0 2px 10px var(--shadow)',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '20px',
    marginBottom: '24px',
    paddingBottom: '24px',
    borderBottom: '1px solid var(--border)',
  },
  ticketTitle: {
    fontSize: '22px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    color: 'var(--text)',
  },
  ticketDescription: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: 'var(--text-muted)',
    margin: 0,
    whiteSpace: 'pre-wrap' as const,
  },
  statusSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    minWidth: '200px',
  },
  statusControl: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  statusSelect: {
    padding: '8px 12px',
    border: '2px solid #007bff',
    borderRadius: '4px',
    fontSize: '13px',
    fontFamily: 'inherit',
    fontWeight: '500' as const,
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
  },
  controlRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '20px',
    marginBottom: '24px',
    paddingBottom: '24px',
    borderBottom: '1px solid var(--border)',
    flexWrap: 'wrap' as const,
  },
  leftControls: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '20px',
    flexWrap: 'wrap' as const,
  },
  urgencyControl: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    minWidth: '150px',
  },
  urgencySelect: {
    padding: '8px 12px',
    border: '2px solid',
    borderRadius: '4px',
    fontSize: '13px',
    fontFamily: 'inherit',
    fontWeight: '500' as const,
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
  },
  urgencyBadge: {
    padding: '8px 12px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '13px',
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
  statusBadge: {
    padding: '8px 12px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '13px',
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
  resolveBtn: {
    marginTop: '8px',
    padding: '10px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600' as const,
    width: '100%',
  },
  pinControls: {
    display: 'flex',
    gap: '8px',
  },
  pinBtn: {
    padding: '8px 12px',
    fontSize: '13px',
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500' as const,
    transition: 'all 0.2s',
    color: 'var(--text)',
  },
  pinBtnActive: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
    color: '#856404',
  },
  section: {
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '1px solid var(--border)',
  },
  subtitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px',
    color: 'var(--text)',
    margin: '0 0 12px 0',
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
    color: 'var(--text)',
    minWidth: '150px',
  },
  creatorBadge: {
    fontSize: '11px',
    backgroundColor: 'var(--tag-bg)',
    color: 'var(--tag-text)',
    padding: '2px 6px',
    borderRadius: '3px',
    marginLeft: '8px',
    fontWeight: '600' as const,
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
  },
  tag: {
    display: 'inline-block',
    padding: '6px 12px',
    backgroundColor: 'var(--tag-bg)',
    color: 'var(--tag-text)',
    borderRadius: '16px',
    fontSize: '13px',
    fontWeight: '500' as const,
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
  },
  photoContainer: {
    borderRadius: '4px',
    overflow: 'hidden',
    backgroundColor: 'var(--bg)',
  },
  photo: {
    width: '100%',
    height: '200px',
    objectFit: 'cover' as const,
    display: 'block',
  },
  photoCaption: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    padding: '8px 12px',
    margin: 0,
  },
  photoDate: {
    fontSize: '11px',
    color: 'var(--text-faint)',
    padding: '0 12px 8px 12px',
    margin: 0,
  },
  auditTrail: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  auditEntry: {
    padding: '12px',
    backgroundColor: 'var(--bg)',
    borderLeft: '3px solid #007bff',
    borderRadius: '4px',
  },
  auditTime: {
    fontSize: '11px',
    color: 'var(--text-faint)',
    marginBottom: '4px',
  },
  auditChange: {
    fontSize: '13px',
    color: 'var(--text)',
  },
  auditFrom: {
    fontWeight: '500' as const,
    color: 'var(--text-muted)',
  },
  auditTo: {
    fontWeight: '600' as const,
    color: 'var(--text)',
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
    fontWeight: '500' as const,
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
    fontWeight: '500' as const,
    flex: 1,
  },
  loading: {
    padding: '20px',
    fontSize: '16px',
    color: 'var(--text-muted)',
  },
  error: {
    padding: '20px',
    fontSize: '16px',
    color: 'var(--danger-text)',
    backgroundColor: 'var(--danger-bg)',
  },
  updateError: {
    padding: '12px 16px',
    backgroundColor: 'var(--danger-bg)',
    color: 'var(--danger-text)',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '16px',
  },
};
