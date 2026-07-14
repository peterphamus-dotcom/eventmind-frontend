import axios from 'axios';
import type { ApiResponse, User, Report, Ticket, Tag, Team, Location, Comment, ReactionSummary, PaginatedResponse } from './types';

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
  listUsers: (page = 1, pageSize = 20, filters?: any) =>
    client.get<ApiResponse<PaginatedResponse<User>>>('/users', { params: { page, pageSize, ...filters } }),
  updateUser: (id: string, role?: string, teamIds?: string[]) =>
    client.patch<ApiResponse<User>>(`/users/${id}`, { role, teamIds }),

  // Locations
  listLocations: () =>
    client.get<ApiResponse<{ items: Location[] }>>('/locations'),
  getLocation: (id: string) =>
    client.get<ApiResponse<Location>>(`/locations/${id}`),
  createLocation: (name: string) =>
    client.post<ApiResponse<Location>>('/locations', { name }),

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
};
