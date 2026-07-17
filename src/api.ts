import axios from 'axios';
import type { ApiResponse, User, Report, Ticket, Tag, Team, Location, Comment, ReactionSummary, PaginatedResponse, Notification, NotificationSettings, Reminder, ReminderTargetType, SocialSighting, SocialSightingType, SocialPlatform, PublicUserProfile, UserReport, UserReportReason, UserReportStatus, LibraryDocument, ViewDensity, ScheduleItem, DraftScheduleItem, ScheduleImportSourceType } from './types';

type TeamPreview<T> = PaginatedResponse<T> & { team: { id: string; name: string; tags: Tag[] } };

type ReactionsPayload = { reactions: ReactionSummary[] };

// Production always uses the same-origin /api proxy (see server.js) so the
// session cookie stays first-party — Safari/iOS blocks cross-site cookies.
// Local dev talks to the backend directly.
const API_URL = import.meta.env.DEV
  ? import.meta.env.VITE_API_URL || 'http://localhost:3000'
  : '/api';

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies with requests
});

/**
 * Resolve a Photo.url to an <img> src. R2-stored photos are absolute
 * URLs used as-is; local-dev photos are relative /uploads paths that
 * need the API base prepended.
 */
export function photoSrc(url: string): string {
  return url.startsWith('http') ? url : `${API_URL}${url}`;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    client.post<ApiResponse<User>>('/auth/login', { email, password }),
  logout: () => client.post<ApiResponse<{ message: string }>>('/auth/logout'),
  register: (email: string, password: string, name: string, homeLocationId: string) =>
    client.post<ApiResponse<User>>('/auth/register', { email, password, name, homeLocationId }),

  // Users
  getMe: () => client.get<ApiResponse<User>>('/users/me'),
  getUser: (id: string) => client.get<ApiResponse<User>>(`/users/${id}`),
  getUserProfile: (id: string) => client.get<ApiResponse<PublicUserProfile>>(`/users/${id}/profile`),
  listUsers: (page = 1, pageSize = 20, filters?: any) =>
    client.get<ApiResponse<PaginatedResponse<User>>>('/users', { params: { page, pageSize, ...filters } }),
  updateUser: (id: string, role?: string, teamIds?: string[]) =>
    client.patch<ApiResponse<User>>(`/users/${id}`, { role, teamIds }),
  updateMyProfile: (updates: { name?: string; phone?: string; bio?: string; viewDensity?: ViewDensity }) =>
    client.patch<ApiResponse<User>>('/users/me', updates),
  uploadMyAvatar: (file: File) => {
    const fd = new FormData();
    fd.append('avatar', file);
    return client.post<ApiResponse<{ avatarUrl: string }>>('/users/me/avatar', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  removeMyAvatar: () =>
    client.delete<ApiResponse<{ avatarUrl: null }>>('/users/me/avatar'),

  // Locations
  listLocations: () =>
    client.get<ApiResponse<{ items: Location[] }>>('/locations'),
  getLocation: (id: string) =>
    client.get<ApiResponse<Location>>(`/locations/${id}`),
  createLocation: (name: string) =>
    client.post<ApiResponse<Location>>('/locations', { name }),
  uploadLocationFloorplan: (locationId: string, file: File) => {
    const fd = new FormData();
    fd.append('floorplan', file);
    return client.post<ApiResponse<{ floorplanUrl: string }>>(
      `/locations/${locationId}/floorplan`,
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },
  removeLocationFloorplan: (locationId: string) =>
    client.delete<ApiResponse<{ floorplanUrl: null }>>(`/locations/${locationId}/floorplan`),

  // Tags
  listTags: (page = 1, pageSize = 50) =>
    client.get<ApiResponse<PaginatedResponse<Tag>>>('/tags', { params: { page, pageSize } }),
  getTag: (id: string) =>
    client.get<ApiResponse<Tag>>(`/tags/${id}`),
  createTag: (name: string) =>
    client.post<ApiResponse<Tag>>('/tags', { name }),
  deleteTag: (id: string) =>
    client.delete<ApiResponse<{ message: string }>>(`/tags/${id}`),

  // Reports
  listReports: (page = 1, pageSize = 20, filters?: any) =>
    client.get<ApiResponse<PaginatedResponse<Report>>>('/reports', {
      params: { page, pageSize, ...filters },
    }),
  getReport: (id: string) =>
    client.get<ApiResponse<Report>>(`/reports/${id}`),
  createReport: (formData: FormData) =>
    client.post<ApiResponse<Report>>('/reports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  addReportComment: (id: string, text: string) =>
    client.post<ApiResponse<Comment>>(`/reports/${id}/comments`, { text }),
  toggleReportReaction: (id: string, emoji: string) =>
    client.post<ApiResponse<ReactionsPayload>>(`/reports/${id}/reactions`, { emoji }),
  toggleReportCommentReaction: (reportId: string, commentId: string, emoji: string) =>
    client.post<ApiResponse<ReactionsPayload>>(
      `/reports/${reportId}/comments/${commentId}/reactions`,
      { emoji }
    ),
  subscribeReport: (id: string) =>
    client.post<ApiResponse<{ reportId: string; isSubscribed: boolean }>>(`/reports/${id}/subscribe`),

  // Tickets
  listTickets: (page = 1, pageSize = 20, filters?: any) =>
    client.get<ApiResponse<PaginatedResponse<Ticket>>>('/tickets', { params: { page, pageSize, ...filters } }),
  getTicket: (id: string) =>
    client.get<ApiResponse<Ticket>>(`/tickets/${id}`),
  createTicket: (formData: FormData) =>
    client.post<ApiResponse<Ticket>>('/tickets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateTicket: (id: string, status?: string, urgency?: string) =>
    client.patch<ApiResponse<Ticket>>(`/tickets/${id}`, { status, urgency }),
  pinTicket: (id: string) =>
    client.post<ApiResponse<{ ticketId: string; isPinnedGlobal: boolean }>>(`/tickets/${id}/pin`),
  pinTicketPersonal: (id: string) =>
    client.post<ApiResponse<{ ticketId: string; isPinned: boolean }>>(`/tickets/${id}/personal-pin`),
  subscribeTicket: (id: string) =>
    client.post<ApiResponse<{ ticketId: string; isSubscribed: boolean }>>(`/tickets/${id}/subscribe`),
  addTicketComment: (id: string, text: string) =>
    client.post<ApiResponse<Comment>>(`/tickets/${id}/comments`, { text }),
  toggleTicketReaction: (id: string, emoji: string) =>
    client.post<ApiResponse<ReactionsPayload>>(`/tickets/${id}/reactions`, { emoji }),
  toggleTicketCommentReaction: (ticketId: string, commentId: string, emoji: string) =>
    client.post<ApiResponse<ReactionsPayload>>(
      `/tickets/${ticketId}/comments/${commentId}/reactions`,
      { emoji }
    ),
  getTicketStats: () =>
    client.get<ApiResponse<Record<'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED', number>>>('/tickets/stats'),

  // Teams
  listTeams: () =>
    client.get<ApiResponse<{ items: Team[]; total: number }>>('/teams'),
  createTeam: (name: string, tagIds?: string[], memberIds?: string[]) =>
    client.post<ApiResponse<Team>>('/teams', { name, tagIds, memberIds }),
  updateTeam: (id: string, updates: { name?: string; tagIds?: string[]; memberIds?: string[] }) =>
    client.patch<ApiResponse<Team>>(`/teams/${id}`, updates),
  deleteTeam: (id: string) =>
    client.delete<ApiResponse<{ message: string }>>(`/teams/${id}`),

  // AI event summary
  getEventSummary: () =>
    client.get<ApiResponse<{
      headline: string;
      actions: { action: string; priority: 'HIGH' | 'MEDIUM' | 'LOW' }[];
      generatedAt: string;
    } | null>>('/summary'),

  // Banner
  getBanner: () =>
    client.get<ApiResponse<{ message: string; messages: string[]; isActive: boolean; imageUrl: string | null } | null>>('/banner'),
  setBanner: (messages: string[], isActive: boolean) =>
    client.put<ApiResponse<{ message: string; messages: string[]; isActive: boolean; imageUrl: string | null }>>('/banner', { messages, isActive }),
  setBannerImage: (file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    return client.post<ApiResponse<{ imageUrl: string }>>('/banner/image', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  removeBannerImage: () =>
    client.delete<ApiResponse<{ imageUrl: null }>>('/banner/image'),

  // Admin
  seedDatabase: () =>
    client.post<ApiResponse<any>>('/admin/seed'),
  exportTicketsCsv: () =>
    client.get('/admin/export/tickets.csv', { responseType: 'blob' }),
  exportReportsCsv: () =>
    client.get('/admin/export/reports.csv', { responseType: 'blob' }),
  previewTicketsAsTeam: (teamId: string) =>
    client.get<ApiResponse<TeamPreview<Ticket>>>('/admin/preview/tickets', { params: { teamId, pageSize: 100 } }),
  previewReportsAsTeam: (teamId: string) =>
    client.get<ApiResponse<TeamPreview<Report>>>('/admin/preview/reports', { params: { teamId, pageSize: 100 } }),

  // Notifications
  listNotifications: (page = 1, pageSize = 20) =>
    client.get<ApiResponse<PaginatedResponse<Notification>>>('/notifications', { params: { page, pageSize } }),
  getUnreadNotificationCount: () =>
    client.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),
  markNotificationRead: (id: string) =>
    client.post<ApiResponse<Notification>>(`/notifications/${id}/read`),
  markAllNotificationsRead: () =>
    client.post<ApiResponse<{ updated: number }>>('/notifications/read-all'),
  getNotificationSettings: () =>
    client.get<ApiResponse<NotificationSettings>>('/notifications/settings'),
  updateNotificationSettings: (updates: Partial<NotificationSettings>) =>
    client.patch<ApiResponse<NotificationSettings>>('/notifications/settings', updates),
  getVapidPublicKey: () =>
    client.get<ApiResponse<{ publicKey: string }>>('/notifications/vapid-public-key'),
  subscribePush: (subscription: PushSubscriptionJSON) =>
    client.post<ApiResponse<{ subscribed: boolean }>>('/notifications/push-subscribe', subscription),
  unsubscribePush: (endpoint: string) =>
    client.post<ApiResponse<{ subscribed: boolean }>>('/notifications/push-unsubscribe', { endpoint }),

  // Feedback
  submitFeedback: (type: 'FEATURE' | 'ISSUE', message: string) =>
    client.post<ApiResponse<{ message: string }>>('/feedback', { type, message }),

  // Report reminders
  listReminders: () =>
    client.get<ApiResponse<{ items: Reminder[]; total: number }>>('/reminders'),
  createReminder: (data: {
    targetType: ReminderTargetType;
    userId?: string;
    teamId?: string;
    locationId?: string;
    intervalMinutes: number;
  }) => client.post<ApiResponse<Reminder>>('/reminders', data),
  updateReminder: (id: string, updates: { intervalMinutes?: number; isActive?: boolean }) =>
    client.patch<ApiResponse<Reminder>>(`/reminders/${id}`, updates),
  deleteReminder: (id: string) =>
    client.delete<ApiResponse<{ message: string }>>(`/reminders/${id}`),

  // Social intel (manually logged sightings)
  listSocialSightings: (filters?: { type?: SocialSightingType; platform?: SocialPlatform }) =>
    client.get<ApiResponse<{ items: SocialSighting[]; total: number }>>('/social-sightings', {
      params: filters,
    }),
  createSocialSighting: (data: {
    type: SocialSightingType;
    platform: SocialPlatform;
    url: string;
    handle?: string;
    followerCount?: number;
    note?: string;
  }) => client.post<ApiResponse<SocialSighting>>('/social-sightings', data),
  deleteSocialSighting: (id: string) =>
    client.delete<ApiResponse<{ message: string }>>(`/social-sightings/${id}`),

  // User conduct reports
  listUserReports: (filters?: { status?: UserReportStatus }) =>
    client.get<ApiResponse<{ items: UserReport[]; total: number }>>('/user-reports', { params: filters }),
  createUserReport: (data: { reportedUserId: string; reason: UserReportReason; details?: string }) =>
    client.post<ApiResponse<UserReport>>('/user-reports', data),
  updateUserReportStatus: (id: string, status: UserReportStatus) =>
    client.patch<ApiResponse<UserReport>>(`/user-reports/${id}`, { status }),

  // Document library (single source of truth docs)
  listLibraryDocuments: (filters?: { search?: string; tagIds?: string[] }) =>
    client.get<ApiResponse<{ items: LibraryDocument[]; total: number }>>('/library', {
      params: {
        search: filters?.search || undefined,
        tagIds: filters?.tagIds && filters.tagIds.length > 0 ? filters.tagIds.join(',') : undefined,
      },
    }),
  createLibraryTextDocument: (data: { title: string; content: string; tagIds?: string[] }) =>
    client.post<ApiResponse<LibraryDocument>>('/library', data),
  uploadLibraryDocument: (formData: FormData) =>
    client.post<ApiResponse<LibraryDocument>>('/library/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateLibraryDocument: (
    id: string,
    updates: { title?: string; content?: string; tagIds?: string[] }
  ) => client.patch<ApiResponse<LibraryDocument>>(`/library/${id}`, updates),
  deleteLibraryDocument: (id: string) =>
    client.delete<ApiResponse<{ message: string }>>(`/library/${id}`),

  // Schedule
  listSchedule: (filters?: { search?: string; locationId?: string }) =>
    client.get<ApiResponse<{ items: ScheduleItem[]; total: number }>>('/schedule', { params: filters }),
  getScheduleItem: (id: string) =>
    client.get<ApiResponse<ScheduleItem>>(`/schedule/${id}`),
  createScheduleItem: (data: {
    title: string;
    description?: string;
    startTime: string;
    endTime?: string;
    locationId?: string;
  }) => client.post<ApiResponse<ScheduleItem>>('/schedule', data),
  updateScheduleItem: (
    id: string,
    updates: { title?: string; description?: string | null; startTime?: string; endTime?: string | null; locationId?: string | null }
  ) => client.patch<ApiResponse<ScheduleItem>>(`/schedule/${id}`, updates),
  deleteScheduleItem: (id: string) =>
    client.delete<ApiResponse<{ message: string }>>(`/schedule/${id}`),
  addScheduleComment: (id: string, text: string) =>
    client.post<ApiResponse<Comment>>(`/schedule/${id}/comments`, { text }),
  toggleScheduleCommentReaction: (itemId: string, commentId: string, emoji: string) =>
    client.post<ApiResponse<ReactionsPayload>>(`/schedule/${itemId}/comments/${commentId}/reactions`, { emoji }),
  subscribeScheduleItem: (id: string) =>
    client.post<ApiResponse<{ itemId: string; isSubscribed: boolean }>>(`/schedule/${id}/subscribe`),
  setScheduleReminder: (id: string, offsetMinutes: number) =>
    client.post<ApiResponse<{ itemId: string; offsetMinutes: number }>>(`/schedule/${id}/reminder`, { offsetMinutes }),
  removeScheduleReminder: (id: string) =>
    client.delete<ApiResponse<{ itemId: string; offsetMinutes: null }>>(`/schedule/${id}/reminder`),
  previewScheduleImport: (file: File, sourceType: ScheduleImportSourceType) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('sourceType', sourceType);
    return client.post<ApiResponse<{ items: DraftScheduleItem[]; total: number }>>('/schedule/import/preview', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  confirmScheduleImport: (
    items: { title: string; description?: string | null; startTime: string; endTime?: string | null; locationId?: string | null }[]
  ) => client.post<ApiResponse<{ created: number }>>('/schedule/import/confirm', { items }),
};
