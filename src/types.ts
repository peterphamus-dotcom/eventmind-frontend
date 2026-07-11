// Type definitions matching backend API

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'MEMBER' | 'CORE_TEAM' | 'ADMIN';
  homeLocationId: string;
  homeLocation?: Location;
  teams?: Team[];
  createdAt: string;
}

export interface Location {
  id: string;
  name: string;
  isActive?: boolean;
}

export interface Team {
  id: string;
  name: string;
  tags?: Tag[];
}

export interface Tag {
  id: string;
  name: string;
  isPredefined: boolean;
}

export enum Urgency {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  ARCHIVED = 'ARCHIVED',
}

export interface Report {
  id: string;
  text: string;
  locationId: string;
  location?: Location;
  submitterId: string;
  submitter?: { id: string; name: string; email: string };
  isOutsideHomeLocation: boolean;
  tags?: Tag[];
  photos?: Photo[];
  submittedAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  locationId: string;
  location?: Location;
  urgency: Urgency;
  status: TicketStatus;
  submitterId: string;
  submitter?: { id: string; name: string; email: string };
  isOutsideHomeLocation: boolean;
  isPinnedGlobal: boolean;
  pinnedBy?: { id: string; name: string };
  pinnedAt?: string;
  tags?: Tag[];
  photos?: Photo[];
  urgencyAudits?: UrgencyAudit[];
  userHasPersonalPin?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UrgencyAudit {
  id: string;
  fromUrgency: Urgency | null;
  toUrgency: Urgency;
  changedBy: { id: string; name: string };
  changedAt: string;
}

export interface Photo {
  id: string;
  url: string;
  caption?: string;
  uploadedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
