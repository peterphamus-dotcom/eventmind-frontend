import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import { useToast } from '../Toast';
import { useConversationRoom, useSocketEvent } from '../useSocket';
import { NewMessageModal } from '../components/NewMessageModal';
import { ReportContentDialog } from '../components/ReportContentDialog';
import type { ConversationSummary, ConversationMessage, UserReportReason } from '../types';

function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function conversationLabel(c: ConversationSummary): string {
  if (c.isGroup) return c.name || 'Group';
  return c.participants[0]?.name || 'Unknown';
}

// Below 700px, show either the conversation list or the open thread, not
// both — the .thread-active class (set once a conversation is opened) swaps
// which pane is visible. Desktop always shows both side by side.
const RESPONSIVE_CSS = `
@media (max-width: 700px) {
  .msg-list-pane { display: flex !important; }
  .msg-thread-pane { display: none !important; }
  .msg-body.thread-active .msg-list-pane { display: none !important; }
  .msg-body.thread-active .msg-thread-pane { display: flex !important; }
  .msg-mobile-back { display: inline-flex !important; }
}
`;

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();

  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [messagesTotal, setMessagesTotal] = useState(0);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [sending, setSending] = useState(false);
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [reportingMessageId, setReportingMessageId] = useState<string | null>(null);
  const [showThreadOnMobile, setShowThreadOnMobile] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const canModerate = user?.role === 'ADMIN' || user?.role === 'CORE_TEAM';

  const loadConversations = useCallback(async () => {
    try {
      const res = await api.listConversations();
      setConversations(res.data.data || []);
    } catch {
      setConversations([]);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useConversationRoom(activeId);

  useSocketEvent<{ conversationId: string }>('conversation:updated', (payload) => {
    if (payload.conversationId !== activeId) loadConversations();
  });

  useSocketEvent<ConversationMessage>('message:new', (message) => {
    if (message.conversationId === activeId) {
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      if (message.sender.id !== user?.id) {
        api.markConversationRead(message.conversationId).catch(() => {});
      }
      loadConversations();
    } else {
      loadConversations();
    }
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function openConversation(id: string) {
    setActiveId(id);
    setShowThreadOnMobile(true);
    setLoadingMessages(true);
    try {
      const res = await api.getConversationMessages(id, 1, 30);
      const data = res.data.data;
      setMessages((data?.items || []).slice().reverse());
      setMessagesTotal(data?.total || 0);
      await api.markConversationRead(id);
      setConversations((prev) => prev?.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)) || null);
    } catch {
      setMessages([]);
      setMessagesTotal(0);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function loadOlder() {
    if (!activeId) return;
    const nextPage = Math.floor(messages.length / 30) + 1;
    try {
      const res = await api.getConversationMessages(activeId, nextPage, 30);
      const older = (res.data.data?.items || []).slice().reverse();
      setMessages((prev) => [...older, ...prev]);
    } catch {
      // best-effort
    }
  }

  async function handleSend() {
    const body = composeText.trim();
    if (!body || !activeId || sending) return;
    setSending(true);
    try {
      const res = await api.sendMessage(activeId, body);
      const sent = res.data.data;
      if (sent) {
        // The server also broadcasts this message back over the conversation's
        // socket room (including to the sender), which can arrive before this
        // REST response does — dedupe by id so it isn't appended twice.
        setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
      }
      setComposeText('');
      loadConversations();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  async function handleCreated(conversationId: string) {
    setNewMessageOpen(false);
    await loadConversations();
    openConversation(conversationId);
  }

  async function toggleHide(messageId: string) {
    try {
      await api.hideMessage(messageId);
      // Refetch rather than patch locally — the sender/moderator view of a
      // hidden message still needs its real body, which this client copy
      // doesn't have once withheld.
      if (activeId) {
        const res = await api.getConversationMessages(activeId, 1, Math.max(30, messages.length));
        setMessages((res.data.data?.items || []).slice().reverse());
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update message');
    }
  }

  async function submitReport(reason: UserReportReason, details: string) {
    if (!reportingMessageId) return;
    await api.reportMessage(reportingMessageId, reason, details || undefined);
    setReportingMessageId(null);
    showToast('Report submitted to moderators');
  }

  const activeConversation = conversations?.find((c) => c.id === activeId) || null;

  return (
    <div style={styles.container}>
      <style>{RESPONSIVE_CSS}</style>
      <div style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Dashboard
        </button>
        <h1 style={styles.title}>Messages</h1>
        <button style={styles.newBtn} onClick={() => setNewMessageOpen(true)}>
          + New
        </button>
      </div>

      <div style={styles.body} className={`msg-body${showThreadOnMobile ? ' thread-active' : ''}`}>
        <div style={styles.listPane} className="msg-list-pane">
          {conversations == null ? (
            <p style={styles.empty}>Loading…</p>
          ) : conversations.length === 0 ? (
            <p style={styles.empty}>No conversations yet. Start one with "+ New".</p>
          ) : (
            conversations.map((c) => {
              const label = conversationLabel(c);
              return (
                <button
                  key={c.id}
                  onClick={() => openConversation(c.id)}
                  style={{ ...styles.convItem, ...(activeId === c.id ? styles.convItemActive : {}) }}
                >
                  <div style={styles.avatar}>{initialsOf(label)}</div>
                  <div style={styles.convBody}>
                    <div style={styles.convTopRow}>
                      <span style={styles.convName}>{label}</span>
                      {c.lastMessage && <span style={styles.convTime}>{relativeTime(c.lastMessage.createdAt)}</span>}
                    </div>
                    <div style={styles.convPreviewRow}>
                      <span style={styles.convPreview}>
                        {c.lastMessage
                          ? c.lastMessage.isHidden
                            ? 'Message removed'
                            : `${c.lastMessage.senderId === user?.id ? 'You: ' : ''}${c.lastMessage.body}`
                          : 'No messages yet'}
                      </span>
                      {c.unreadCount > 0 && <span style={styles.unreadBadge}>{c.unreadCount}</span>}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div style={styles.threadPane} className="msg-thread-pane">
          {!activeConversation ? (
            <div style={styles.threadEmpty}>Select a conversation to view messages.</div>
          ) : (
            <>
              <div style={styles.threadHeader}>
                <button style={styles.mobileBackBtn} className="msg-mobile-back" onClick={() => setShowThreadOnMobile(false)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <span style={styles.threadHeaderName}>{conversationLabel(activeConversation)}</span>
              </div>

              <div ref={scrollRef} style={styles.messageList}>
                {loadingMessages ? (
                  <p style={styles.empty}>Loading…</p>
                ) : (
                  <>
                    {messages.length < messagesTotal && (
                      <button style={styles.loadOlderBtn} onClick={loadOlder}>
                        Load older messages
                      </button>
                    )}
                    {messages.map((m) => {
                      const isMine = m.sender.id === user?.id;
                      const withheld = m.isHidden && !isMine && !canModerate;
                      return (
                        <div key={m.id} style={{ ...styles.messageRow, ...(isMine ? styles.messageRowMine : {}) }}>
                          <div style={{ ...styles.bubble, ...(isMine ? styles.bubbleMine : {}) }}>
                            {!isMine && activeConversation.isGroup && (
                              <div style={styles.senderName}>{m.sender.name}</div>
                            )}
                            <div style={withheld ? styles.bubbleWithheld : undefined}>
                              {withheld ? 'This message was removed by a moderator.' : m.body}
                            </div>
                            {m.isHidden && (isMine || canModerate) && <div style={styles.hiddenTag}>Hidden</div>}
                          </div>
                          <div style={styles.messageActions}>
                            <span style={styles.messageTime}>{relativeTime(m.createdAt)}</span>
                            {!isMine && (
                              <button style={styles.actionLink} onClick={() => setReportingMessageId(m.id)}>
                                Report
                              </button>
                            )}
                            {canModerate && (
                              <button style={styles.actionLink} onClick={() => toggleHide(m.id)}>
                                {m.isHidden ? 'Unhide' : 'Hide'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              <div style={styles.composeRow}>
                <textarea
                  value={composeText}
                  onChange={(e) => setComposeText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Write a message…"
                  style={styles.composeInput}
                  maxLength={5000}
                  rows={1}
                />
                <button style={styles.sendBtn} onClick={handleSend} disabled={sending || !composeText.trim()}>
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {newMessageOpen && <NewMessageModal onClose={() => setNewMessageOpen(false)} onCreated={handleCreated} />}
      {reportingMessageId && (
        <ReportContentDialog what="message" onSubmit={submitReport} onClose={() => setReportingMessageId(null)} />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: 'var(--bg)',
    color: 'var(--text)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    backgroundColor: 'var(--surface)',
    padding: '20px clamp(16px, 4vw, 40px)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    flexWrap: 'wrap',
  },
  backBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--accent)',
    fontSize: '13.5px',
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
  },
  title: {
    fontSize: '19px',
    fontWeight: 700,
    margin: 0,
  },
  newBtn: {
    marginLeft: 'auto',
    padding: '9px 16px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13.5px',
    fontWeight: 600,
  },
  body: {
    flex: 1,
    display: 'flex',
    maxWidth: '1100px',
    width: '100%',
    margin: '0 auto',
    minHeight: 0,
  },
  listPane: {
    width: '320px',
    flexShrink: 0,
    borderRight: '1px solid var(--border)',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  convItem: {
    display: 'flex',
    gap: '10px',
    padding: '13px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--border)',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
  },
  convItemActive: {
    backgroundColor: 'var(--accent-soft-translucent)',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-soft)',
    color: 'var(--accent-text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 700,
    flexShrink: 0,
  },
  convBody: {
    minWidth: 0,
    flex: 1,
  },
  convTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '8px',
  },
  convName: {
    fontSize: '13.5px',
    fontWeight: 700,
    color: 'var(--text)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  convTime: {
    fontSize: '11px',
    color: 'var(--text-faint)',
    flexShrink: 0,
  },
  convPreviewRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    marginTop: '3px',
  },
  convPreview: {
    fontSize: '12.5px',
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  unreadBadge: {
    backgroundColor: 'var(--accent)',
    color: 'white',
    fontSize: '10.5px',
    fontWeight: 700,
    borderRadius: '999px',
    padding: '1px 7px',
    flexShrink: 0,
  },
  threadPane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  threadEmpty: {
    margin: 'auto',
    fontSize: '13.5px',
    color: 'var(--text-faint)',
    fontStyle: 'italic',
  },
  threadHeader: {
    padding: '14px 18px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  mobileBackBtn: {
    display: 'none',
    background: 'transparent',
    border: 'none',
    color: 'var(--accent)',
    cursor: 'pointer',
    padding: 0,
  },
  threadHeaderName: {
    fontSize: '14.5px',
    fontWeight: 700,
  },
  messageList: {
    flex: 1,
    overflowY: 'auto',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  loadOlderBtn: {
    alignSelf: 'center',
    padding: '6px 14px',
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--border-strong)',
    borderRadius: '14px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginBottom: '6px',
  },
  messageRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    maxWidth: '75%',
  },
  messageRowMine: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  bubble: {
    padding: '9px 13px',
    borderRadius: '14px',
    backgroundColor: 'var(--surface-alt)',
    color: 'var(--text)',
    fontSize: '13.5px',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  bubbleMine: {
    backgroundColor: 'var(--accent-soft)',
  },
  bubbleWithheld: {
    fontStyle: 'italic',
    color: 'var(--text-faint)',
  },
  senderName: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--text-muted)',
    marginBottom: '3px',
  },
  hiddenTag: {
    fontSize: '10.5px',
    fontWeight: 700,
    color: 'var(--warning-text2)',
    marginTop: '4px',
  },
  messageActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '4px',
    fontSize: '11px',
  },
  messageTime: {
    color: 'var(--text-faint)',
  },
  actionLink: {
    background: 'none',
    border: 'none',
    color: 'var(--text-faint)',
    cursor: 'pointer',
    padding: 0,
    fontSize: '11px',
    textDecoration: 'underline',
  },
  composeRow: {
    display: 'flex',
    gap: '10px',
    padding: '14px 18px',
    borderTop: '1px solid var(--border)',
    alignItems: 'flex-end',
  },
  composeInput: {
    flex: 1,
    padding: '10px 13px',
    border: '1px solid var(--border-strong)',
    borderRadius: '10px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'none',
    maxHeight: '120px',
  },
  sendBtn: {
    padding: '10px 18px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '9px',
    cursor: 'pointer',
    fontSize: '13.5px',
    fontWeight: 600,
  },
  empty: {
    padding: '30px 16px',
    fontSize: '13px',
    color: 'var(--text-faint)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
};
