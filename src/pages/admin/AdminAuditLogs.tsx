import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import type { AuditLog, PaginatedResponse } from '../../types';
import './AdminAuditLogs.css';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [actionFilter, setActionFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [targetIdFilter, setTargetIdFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Expandable details
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadAuditLogs();
  }, [page, pageSize, actionFilter, actorFilter, targetIdFilter, startDate, endDate]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getAuditLogs({
        page,
        pageSize,
        action: actionFilter || undefined,
        actorId: actorFilter || undefined,
        targetId: targetIdFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (response.data.success && response.data.data) {
        const data = response.data.data as PaginatedResponse<AuditLog>;
        setLogs(data.items);
        setTotal(data.total);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPage(1);
    setActionFilter('');
    setActorFilter('');
    setTargetIdFilter('');
    setStartDate('');
    setEndDate('');
  };

  const totalPages = Math.ceil(total / pageSize);
  const actionOptions = [
    'USER_SUSPENDED',
    'USER_MUTED',
    'USER_DELETED',
    'USER_APPROVED',
    'USER_REJECTED',
    'EVENT_CREATED',
    'EVENT_DELETED',
    'USER_ROLE_CHANGED',
    'TICKET_CREATED',
    'TICKET_VIEWED',
    'TICKET_STATUS_CHANGED',
    'TICKET_URGENCY_CHANGED',
    'TICKET_DELETED',
    'REPORT_CREATED',
    'REPORT_VIEWED',
    'REPORT_TAGGED',
    'COMMENT_ADDED',
    'COMMUNITY_POST_CREATED',
    'COMMUNITY_POST_VIEWED',
    'COMMUNITY_POST_PINNED',
    'COMMUNITY_POST_DELETED',
    'USER_PROFILE_VIEWED',
  ];

  return (
    <div className="auditLogsContainer">
      <h2>Audit Logs</h2>

      {/* Filters */}
      <div className="auditLogsFilters">
        <div className="filterGroup">
          <label>Action</label>
          <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}>
            <option value="">All Actions</option>
            {actionOptions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>

        <div className="filterGroup">
          <label>Start Date</label>
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
          />
        </div>

        <div className="filterGroup">
          <label>End Date</label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
          />
        </div>

        <div className="filterGroup">
          <label>Target ID</label>
          <input
            type="text"
            placeholder="Filter by target ID"
            value={targetIdFilter}
            onChange={(e) => { setTargetIdFilter(e.target.value); setPage(1); }}
          />
        </div>

        <button className="resetBtn" onClick={handleReset}>Reset Filters</button>
      </div>

      {error && <div className="errorMessage">{error}</div>}

      {loading ? (
        <div className="loading">Loading audit logs...</div>
      ) : (
        <>
          {/* Audit Logs Table */}
          <div className="auditLogsTableWrapper">
            <table className="auditLogsTable">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Category</th>
                  <th>Target</th>
                  <th>Changes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="emptyCell">No audit logs found</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <React.Fragment key={log.id}>
                      <tr className="logRow">
                        <td className="timeCell">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="actorCell">
                          <div className="actorName">{log.actor.name}</div>
                          <div className="actorEmail">{log.actor.email}</div>
                        </td>
                        <td className="actionCell">{log.action}</td>
                        <td className={`categoryCell ${log.category.toLowerCase()}`}>
                          {log.category === 'ADMIN_ACTION' ? '⚙️ Admin' : '👤 User'}
                        </td>
                        <td className="targetCell">
                          {log.targetType && (
                            <>
                              <div className="targetType">{log.targetType}</div>
                              <div className="targetId" title={log.targetId || ''}>
                                {log.targetId?.substring(0, 8)}...
                              </div>
                            </>
                          )}
                        </td>
                        <td className="changesCell">
                          {(log.changesBefore || log.changesAfter) && (
                            <button
                              className="expandBtn"
                              onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                            >
                              {expandedId === log.id ? '−' : '+'}
                            </button>
                          )}
                        </td>
                        <td></td>
                      </tr>

                      {expandedId === log.id && (log.changesBefore || log.changesAfter || log.details) && (
                        <tr className="expandedRow">
                          <td colSpan={7}>
                            <div className="expandedContent">
                              {log.details && (
                                <div className="detailsSection">
                                  <strong>Details:</strong>
                                  <pre>{JSON.stringify(log.details, null, 2)}</pre>
                                </div>
                              )}
                              {log.changesBefore && (
                                <div className="changesSection">
                                  <strong>Before:</strong>
                                  <pre>{JSON.stringify(log.changesBefore, null, 2)}</pre>
                                </div>
                              )}
                              {log.changesAfter && (
                                <div className="changesSection">
                                  <strong>After:</strong>
                                  <pre>{JSON.stringify(log.changesAfter, null, 2)}</pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
              Previous
            </button>
            <span>
              Page {page} of {totalPages} ({total} total)
            </span>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
              Next
            </button>
            <select value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1); }}>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
}
