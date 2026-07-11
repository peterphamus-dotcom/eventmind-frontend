import axios from 'axios';
import type { ApiResponse, User, Report, Ticket, Tag, Location, PaginatedResponse } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies with requests
});

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
  listReports: (page = 1, pageSize = 20, locationId?: string, tagIds?: string[]) =>
    client.get<ApiResponse<PaginatedResponse<Report>>>('/reports', {
      params: { page, pageSize, locationId, tagIds: tagIds?.join(',') },
    }),
  getReport: (id: string) =>
    client.get<ApiResponse<Report>>(`/reports/${id}`),
  createReport: (formData: FormData) =>
    client.post<ApiResponse<Report>>('/reports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

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
};
