// Type definitions matching backend API

export type ViewDensity = 'COMPACT' | 'FULL';

export type UserStatus = 'UNVERIFIED' | 'PENDING' | 'ACTIVE' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'MEMBER' | 'CORE_TEAM' | 'ADMIN';
  status: UserStatus;
  homeLocationId: string | null;
  homeLocation?: Location | null;
  teams?: Team[];
  phone?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  lastReportAt?: string | null;
  reportCount?: number;
  viewDensity?: ViewDensity;
  createdAt: string;
}

/** A user awaiting admin approval, as shown in the admin queue. */
export interface PendingUser {
  id: string;
  email: string;
  name: string;
  bio?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  invitedBy?: { id: string; name: string } | null;
  createdAt: string;
}

export interface PublicUserProfile {
  id: string;
  name: string;
  role: 'MEMBER' | 'CORE_TEAM' | 'ADMIN';
  homeLocation?: Location;
  teams?: Team[];
  bio?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface Location {
  id: string;
  name: string;
  isActive?: boolean;
  floorplanUrl?: string | null;
}

export interface Team {
  id: string;
  name: string;
  tags?: Tag[];
  members?: TeamMember[];
  createdAt?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'MEMBER' | 'CORE_TEAM' | 'ADMIN';
}

export interface Tag {
  id: string;
  name: string;
  isPredefined: boolean;
}

export const Urgency = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;
export type Urgency = (typeof Urgency)[keyof typeof Urgency];

export const TicketStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

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
  comments?: Comment[];
  reactions?: ReactionSummary[];
  isSubscribed?: boolean;
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
  pinX?: number | null;
  pinY?: number | null;
  tags?: Tag[];
  photos?: Photo[];
  urgencyAudits?: UrgencyAudit[];
  comments?: Comment[];
  reactions?: ReactionSummary[];
  userHasPersonalPin?: boolean;
  isSubscribed?: boolean;
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

export interface ReactionSummary {
  emoji: string;
  count: number;
  reactedByMe: boolean;
}

export interface Comment {
  id: string;
  text: string;
  author: { id: string; name: string };
  reactions?: ReactionSummary[];
  createdAt: string;
}

export type NotificationType = 'COMMENT' | 'STATUS_CHANGE' | 'URGENCY_CHANGE' | 'REACTION' | 'REMINDER_OVERDUE' | 'SCHEDULE_REMINDER' | 'NEW_SIGNUP' | 'ACCOUNT_STATUS';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  ticketId?: string | null;
  reportId?: string | null;
  scheduleItemId?: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationSettings {
  notifyOnComment: boolean;
  notifyOnStatusChange: boolean;
  notifyOnUrgencyChange: boolean;
  notifyOnReaction: boolean;
  notifyOnReminderOverdue: boolean;
  notifyOnScheduleReminder: boolean;
}

export type ReminderTargetType = 'USER' | 'TEAM' | 'LOCATION';

export interface Reminder {
  id: string;
  targetType: ReminderTargetType;
  userId?: string | null;
  teamId?: string | null;
  locationId?: string | null;
  targetName: string;
  intervalMinutes: number;
  isActive: boolean;
  lastFulfilledAt: string;
  dueAt: string;
  isOverdue: boolean;
  createdBy: { id: string; name: string };
  createdAt: string;
}

export type SocialSightingType = 'TREND' | 'INFLUENCER';
export type SocialPlatform = 'INSTAGRAM' | 'TWITTER' | 'TIKTOK' | 'FACEBOOK' | 'OTHER';

export interface SocialSighting {
  id: string;
  type: SocialSightingType;
  platform: SocialPlatform;
  url: string;
  handle?: string | null;
  followerCount?: number | null;
  note?: string | null;
  loggedBy: { id: string; name: string };
  createdAt: string;
}

export type UserReportReason = 'HARASSMENT' | 'INAPPROPRIATE_CONTENT' | 'SAFETY_CONCERN' | 'SPAM' | 'OTHER';
export type UserReportStatus = 'OPEN' | 'RESOLVED' | 'DISMISSED';

export interface UserReport {
  id: string;
  reason: UserReportReason;
  details?: string | null;
  status: UserReportStatus;
  reporter: { id: string; name: string };
  reportedUser: { id: string; name: string };
  resolvedBy?: { id: string; name: string } | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export type LibraryDocumentKind = 'FILE' | 'TEXT';

export interface LibraryDocument {
  id: string;
  title: string;
  kind: LibraryDocumentKind;
  content?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  tags: Tag[];
  createdBy: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleItem {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime?: string | null;
  location?: { id: string; name: string } | null;
  createdBy: { id: string; name: string };
  commentCount?: number;
  isSubscribed?: boolean;
  myReminderOffsetMinutes?: number | null;
  comments?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export type ScheduleImportSourceType = 'ICS' | 'EXCEL' | 'PDF' | 'IMAGE';

export interface DraftScheduleItem {
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  locationName: string | null;
  suggestedLocationId?: string | null;
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
