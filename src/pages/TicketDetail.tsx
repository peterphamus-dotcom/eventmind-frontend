import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api, photoSrc } from '../api';
import { useAuth } from '../AuthContext';
import { useToast } from '../Toast';
import { CommentsSection } from '../components/CommentsSection';
import { ReactionBar } from '../components/ReactionBar';
import {
  DetailPage,
  DetailSection,
  DetailRow,
  BellIcon,
  styles as detail,
} from '../components/DetailPage';
import { urgencyBadge, statusBadge, urgencyRail } from '../components/badges';
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

  if (isLoading) return <div style={detail.loading}>Loading…</div>;
  if (error) return <div style={detail.error}>{error}</div>;
  if (!ticket) return <div style={detail.error}>Ticket not found</div>;

  return (
    <DetailPage title="Ticket Details">
      {updateError && <div style={styles.updateError}>{updateError}</div>}

      {/* Title, description, reactions */}
      <DetailSection>
        <h2 style={styles.ticketTitle}>{ticket.title}</h2>
        <p style={detail.bodyText}>{ticket.description}</p>
        <ReactionBar
          reactions={ticket.reactions || []}
          onToggle={async (emoji) => {
            const res = await api.toggleTicketReaction(ticket.id, emoji);
            return res.data.data!.reactions;
          }}
        />
      </DetailSection>

      {/* Status, urgency, and the pin/subscribe toggles */}
      <div style={styles.controlRow}>
        <div style={styles.leftControls}>
          <div style={styles.control}>
            <label style={styles.label}>Status</label>
            {isAdminOrCore ? (
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                style={{
                  ...styles.select,
                  borderColor: statusTint(ticket.status as TicketStatus),
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
              <div style={statusBadge(ticket.status)}>{ticket.status.replace(/_/g, ' ')}</div>
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
          <div style={styles.control}>
            <label style={styles.label}>Urgency</label>
            {canUpdateUrgency ? (
              <select
                value={ticket.urgency}
                onChange={(e) => handleUrgencyChange(e.target.value)}
                style={{
                  ...styles.select,
                  borderColor: urgencyRail(ticket.urgency as Urgency),
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
              <div style={urgencyBadge(ticket.urgency)}>{ticket.urgency}</div>
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
            {BellIcon}
            {ticket.isSubscribed ? 'Subscribed' : 'Subscribe'}
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
            <StarOutline filled={!!ticket.userHasPersonalPin} />
            {ticket.userHasPersonalPin ? 'Saved' : 'Save'}
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
              <PinOutline filled={ticket.isPinnedGlobal} />
              Global
            </button>
          )}
        </div>
      </div>

      {/* Metadata */}
      <DetailSection title="Details">
        <div style={detail.details}>
          <DetailRow label="Location">{ticket.location?.name || 'Unknown'}</DetailRow>
          <DetailRow label="Reported by">
            {ticket.submitter?.id ? (
              <Link to={`/users/${ticket.submitter.id}`} style={detail.userLink}>
                {ticket.submitter.name}
              </Link>
            ) : (
              ticket.submitter?.name
            )}{' '}
            ({ticket.submitter?.email})
            {isCreator && <span style={styles.creatorBadge}> (You)</span>}
          </DetailRow>
          <DetailRow label="Created at">{new Date(ticket.createdAt).toLocaleString()}</DetailRow>
          <DetailRow label="Updated at">{new Date(ticket.updatedAt).toLocaleString()}</DetailRow>
          <DetailRow label="Outside home location">
            {ticket.isOutsideHomeLocation ? 'Yes' : 'No'}
          </DetailRow>
        </div>
      </DetailSection>

      {/* Tags */}
      {ticket.tags && ticket.tags.length > 0 && (
        <DetailSection title="Tags">
          <div style={detail.tags}>
            {ticket.tags.map((tag) => (
              <span key={tag.id} style={detail.tag}>
                {tag.name}
              </span>
            ))}
          </div>
        </DetailSection>
      )}

      {/* Photos */}
      {ticket.photos && ticket.photos.length > 0 && (
        <DetailSection title={`Photos (${ticket.photos.length})`}>
          <div style={detail.photoGrid}>
            {ticket.photos.map((photo) => (
              <div key={photo.id}>
                <img
                  src={photoSrc(photo.url)}
                  alt={photo.caption || 'Ticket photo'}
                  style={detail.photo}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="%23999"%3EPhoto unavailable%3C/text%3E%3C/svg%3E';
                  }}
                />
                {photo.caption && <p style={detail.photoCaption}>{photo.caption}</p>}
                <p style={detail.photoDate}>{new Date(photo.uploadedAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </DetailSection>
      )}

      {/* Urgency Audit Trail — a dotted timeline, newest entry last */}
      {ticket.urgencyAudits && ticket.urgencyAudits.length > 0 && (
        <DetailSection title="Urgency History">
          <div>
            {ticket.urgencyAudits.map((audit, i) => (
              <div key={audit.id} style={styles.auditEntry}>
                <div style={styles.auditRail}>
                  <span
                    style={{
                      ...styles.auditDot,
                      backgroundColor: urgencyRail(audit.toUrgency as Urgency),
                    }}
                  />
                  {i < ticket.urgencyAudits!.length - 1 && <span style={styles.auditLine} />}
                </div>
                <div style={styles.auditBody}>
                  <div style={styles.auditChange}>
                    {audit.changedBy.name} changed urgency from{' '}
                    <b>{audit.fromUrgency || 'UNSET'}</b> to <b>{audit.toUrgency}</b>
                  </div>
                  <div style={styles.auditTime}>
                    {new Date(audit.changedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DetailSection>
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
      <div style={detail.actions}>
        <button onClick={() => navigate('/tickets/new')} style={detail.primaryBtn}>
          + New Ticket
        </button>
        <button onClick={() => navigate('/dashboard')} style={detail.secondaryBtn}>
          Back to Dashboard
        </button>
      </div>
    </DetailPage>
  );
}

/** Border tint for the status select, matching the badge palette. */
function statusTint(status: TicketStatus): string {
  switch (status) {
    case 'OPEN':
      return 'var(--accent)';
    case 'IN_PROGRESS':
      return 'var(--warning)';
    case 'RESOLVED':
      return 'var(--success)';
    default:
      return 'var(--neutral)';
  }
}

/** Star and pin fill when the toggle is on, outline when off. */
function StarOutline({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9 12 2" />
    </svg>
  );
}

function PinOutline({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a5 5 0 0 0-5 5c0 2.4 1.3 4 2.5 5.2L6 17h5v5l1 2 1-2v-5h5l-3.5-4.8C15.7 11 17 9.4 17 7a5 5 0 0 0-5-5z" />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  updateError: {
    padding: '11px 14px',
    backgroundColor: 'var(--danger-soft)',
    color: 'var(--danger-text)',
    borderRadius: '9px',
    fontSize: '13.5px',
    marginBottom: '18px',
  },
  ticketTitle: {
    fontSize: '21px',
    fontWeight: 700,
    margin: '0 0 8px',
    color: 'var(--text)',
  },
  controlRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '20px',
    flexWrap: 'wrap',
    paddingBottom: '22px',
    marginBottom: '22px',
    borderBottom: '1px solid var(--border)',
  },
  leftControls: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '20px',
    flexWrap: 'wrap',
  },
  control: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
  },
  label: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  select: {
    padding: '8px 11px',
    // Longhand: borderColor is overridden per-status/urgency at the call
    // site, and mixing that with the border shorthand makes React warn
    // about conflicting style properties on every value change.
    borderWidth: '1.5px',
    borderStyle: 'solid',
    borderColor: 'var(--border-strong)',
    borderRadius: '8px',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    fontSize: '13.5px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  resolveBtn: {
    marginTop: '4px',
    padding: '8px 13px',
    backgroundColor: 'var(--success)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12.5px',
    fontWeight: 600,
  },
  pinControls: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  pinBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 13px',
    backgroundColor: 'transparent',
    // Longhand: pinBtnActive overrides borderColor alone, and mixing that
    // with the border shorthand makes React warn on every toggle.
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--border-strong)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12.5px',
    fontWeight: 600,
    color: 'var(--text-muted)',
  },
  pinBtnActive: {
    backgroundColor: 'var(--warning-soft2)',
    borderColor: 'var(--warning-alt)',
    color: 'var(--warning-text2)',
  },
  creatorBadge: {
    color: 'var(--text-faint)',
    fontStyle: 'italic',
  },
  /* Timeline: a coloured dot per change, joined by a rule except at the end. */
  auditEntry: {
    display: 'flex',
    gap: '12px',
  },
  auditRail: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
  },
  auditDot: {
    width: '9px',
    height: '9px',
    borderRadius: '50%',
    marginTop: '4px',
  },
  auditLine: {
    width: '2px',
    flex: 1,
    minHeight: '26px',
    backgroundColor: 'var(--border)',
  },
  auditBody: {
    paddingBottom: '16px',
  },
  auditChange: {
    fontSize: '13px',
    color: 'var(--text)',
    marginBottom: '3px',
  },
  auditTime: {
    fontSize: '11.5px',
    color: 'var(--text-faint)',
  },
};
