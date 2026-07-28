// Type definitions matching backend API

export type ViewDensity = 'COMPACT' | 'FULL';

export type UserStatus = 'UNVERIFIED' | 'PENDING' | 'ACTIVE' | 'REJECTED';

export type Role = 'MEMBER' | 'CORE_TEAM' | 'ADMIN' | 'EXPO';

export type TabId =
  | 'tickets'
  | 'reports'
  | 'floorplan'
  | 'library'
  | 'schedule'
  | 'sideSchedule'
  | 'community'
  | 'networking';

export const COMMENTABLE_TAB_IDS: TabId[] = ['tickets', 'reports', 'schedule', 'community'];

export interface TabSetting {
  visible?: boolean;
  canComment?: boolean;
}

export type TabSettingsMap = Partial<Record<TabId, TabSetting>>;

/**
 * A patch sent to the tab-settings update endpoints: per tab id, `null`
 * clears that tab's override (falls back to team/role default), an object
 * replaces it, and omitting a tab id leaves its existing override untouched.
 */
export type TabSettingsPatch = Partial<Record<TabId, TabSetting | null>>;

export interface EffectiveTabSetting {
  visible: boolean;
  canComment: boolean;
}

export type EffectiveTabSettingsMap = Record<TabId, EffectiveTabSetting>;

/**
 * Who can start a new 1:1 conversation with this user without it landing in
 * their Message Requests inbox first. DO_NOT_DISTURB blocks a brand-new
 * thread entirely (an already-open thread still works); TEAM_ONLY
 * auto-accepts only a shared-team sender (or ADMIN/CORE_TEAM); PUBLIC
 * auto-accepts anyone.
 */
export type MessagePrivacy = 'DO_NOT_DISTURB' | 'TEAM_ONLY' | 'PUBLIC';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  homeLocationId: string | null;
  homeLocation?: Location | null;
  teams?: Team[];
  phone?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  networkingBlurb?: string | null;
  goalTags?: Tag[];
  lastReportAt?: string | null;
  reportCount?: number;
  viewDensity?: ViewDensity;
  shareContactInCommunity?: boolean;
  communityHandle?: string | null;
  communityBooth?: string | null;
  messagePrivacy?: MessagePrivacy;
  isSuspended?: boolean;
  suspendedAt?: string | null;
  suspensionReason?: string | null;
  isMuted?: boolean;
  mutedAt?: string | null;
  mutedReason?: string | null;
  tabSettings?: TabSettingsMap | null;
  effectiveTabSettings?: EffectiveTabSettingsMap;
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
  joinedViaQr?: { id: string; label: string } | null;
  createdAt: string;
}

/** A reusable, admin/core-generated sign-up QR code (see AdminSignupQr). */
export interface SignupQrCode {
  id: string;
  label: string;
  token: string;
  suggestedRole: Role | null;
  team: { id: string; name: string } | null;
  homeLocation: { id: string; name: string } | null;
  isActive: boolean;
  createdBy: { id: string; name: string };
  createdAt: string;
  joinedCount: number;
}

export interface PublicUserProfile {
  id: string;
  name: string;
  role: Role;
  homeLocation?: Location;
  teams?: Team[];
  bio?: string | null;
  avatarUrl?: string | null;
  networkingBlurb?: string | null;
  goalTags?: Tag[];
  messagePrivacy: MessagePrivacy;
  isFollowing: boolean;
  existingConversationId: string | null;
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
  tabSettings?: TabSettingsMap | null;
  createdAt?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Tag {
  id: string;
  name: string;
  isPredefined: boolean;
  isGoalTag: boolean;
}

/**
 * Business networking — goal-tag matching + structured meeting requests.
 * See MeetingRequest below for the accept/decline flow.
 */
export type MeetingRequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';

export interface MeetingRequest {
  id: string;
  requester: { id: string; name: string; avatarUrl?: string | null };
  recipient: { id: string; name: string; avatarUrl?: string | null };
  proposedTime: string;
  note: string | null;
  status: MeetingRequestStatus;
  respondedAt: string | null;
  createdAt: string;
}

export interface TagPair {
  id: string;
  tagA: Tag;
  tagB: Tag;
}

/** A directory/suggested-matches card — the "public-safe" networking view of a user. */
export interface NetworkingProfile {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role: Role;
  networkingBlurb?: string | null;
  goalTags: Tag[];
}

export interface SuggestedMatch extends NetworkingProfile {
  matchCount: number;
  matchedOn: { mine: Tag[]; theirs: Tag[] };
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
  canManage?: boolean;
  // Community comments: whether the viewer may report it (not their own), and
  // whether it's hidden by a moderator (only ever surfaced to the author + mods).
  canReport?: boolean;
  isHidden?: boolean;
}

export type NotificationType = 'COMMENT' | 'STATUS_CHANGE' | 'URGENCY_CHANGE' | 'REACTION' | 'REMINDER_OVERDUE' | 'SCHEDULE_REMINDER' | 'NEW_SIGNUP' | 'ACCOUNT_STATUS' | 'COMMUNITY_REPLY' | 'COMMUNITY_MENTION' | 'COMMUNITY_NEW_POST' | 'COMMUNITY_REPORT';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  ticketId?: string | null;
  reportId?: string | null;
  scheduleItemId?: string | null;
  communityPostId?: string | null;
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
  isPublic: boolean;
  tags: Tag[];
  createdBy: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export type ScheduleItemKind = 'OFFICIAL' | 'SIDE';

export interface ScheduleItem {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime?: string | null;
  location?: { id: string; name: string } | null;
  createdBy: { id: string; name: string };
  kind: ScheduleItemKind;
  isPublic: boolean;
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

// ---- Post-mortem report ----

export interface PostMortemStats {
  range: { startDate: string | null; endDate: string | null; locationIds: string[] };
  tickets: {
    total: number;
    byStatus: Record<'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED', number>;
    byUrgency: Record<'LOW' | 'MEDIUM' | 'HIGH', number>;
    resolvedCount: number;
    avgResolutionHours: number | null;
    medianResolutionHours: number | null;
    oldestUnresolved: { id: string; title: string; urgency: string; createdAt: string; ageDays: number } | null;
  };
  reports: {
    total: number;
    byLocation: Array<{ location: string; count: number }>;
    byTag: Array<{ tag: string; count: number }>;
    byUser: Array<{ userId: string; name: string; count: number }>;
  };
  activity: Array<{ userId: string; name: string; reportsCount: number; ticketsCount: number; score: number }>;
  userConduct: {
    total: number;
    byStatus: Record<'OPEN' | 'RESOLVED' | 'DISMISSED', number>;
    byReason: Record<'HARASSMENT' | 'INAPPROPRIATE_CONTENT' | 'SAFETY_CONCERN' | 'SPAM' | 'OTHER', number>;
  };
  topLocations: Array<{ location: string; ticketCount: number; reportCount: number; total: number }>;
}

export interface PostMortemNarrative {
  executiveSummary: string;
  notableIncidents: string;
  wentWell: string;
  needsImprovement: string;
  recommendations: string[];
}

export interface PostMortemReport {
  stats: PostMortemStats;
  narrative: PostMortemNarrative | null;
}

// ---- B2B Community ----

export type CommunityPostType = 'MEETUP' | 'PROMO' | 'DISCUSSION';
export type CommunitySortBy = 'date' | 'views' | 'comments';

export interface CommunityContact {
  email: string;
  handle: string | null;
  booth: string | null;
}

export interface CommunityAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
  contact: CommunityContact | null;
}

export interface CommunityPost {
  id: string;
  type: CommunityPostType;
  title: string;
  body: string;
  startTime: string | null;
  endTime: string | null;
  meetupLocation: string | null;
  isPinned?: boolean;
  author: CommunityAuthor;
  createdAt: string;
  updatedAt: string;
  viewCount?: number;
  commentCount?: number;
  rsvpCount?: number;
  reactions?: ReactionSummary[];
  myRsvp?: boolean;
  isFollowingAuthor?: boolean;
  canManage?: boolean;
  attendees?: { id: string; name: string }[];
  comments?: Comment[];
  canModerate?: boolean;
  /** Whether the viewer may report this post (true unless they authored it). */
  canReport?: boolean;
}

// A moderator-queue entry for a reported community post or comment.
export interface ContentReport {
  id: string;
  target: 'POST' | 'COMMENT';
  reason: UserReportReason;
  details: string | null;
  status: UserReportStatus;
  reporter: { id: string; name: string };
  postId: string | null;
  postTitle: string | null;
  commentId: string | null;
  commentText: string | null;
  commentAuthor: string | null;
  commentIsHidden: boolean | null;
  postAuthor: string | null;
  resolvedBy: { id: string; name: string } | null;
  resolvedAt: string | null;
  createdAt: string;
}

// Audit log entry tracking admin and user actions
export interface AuditLog {
  id: string;
  action: string;
  category: 'ADMIN_ACTION' | 'USER_ACTION';
  actor: { id: string; name: string; email: string };
  targetId: string | null;
  targetType: string | null;
  details: Record<string, any> | null;
  changesBefore: Record<string, any> | null;
  changesAfter: Record<string, any> | null;
  createdAt: string;
}

// ---- Private messaging ----

export interface MessageableUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: Role;
  messagePrivacy: MessagePrivacy;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  sender: { id: string; name: string; avatarUrl: string | null };
  /** Null when isHidden is true and the viewer isn't the sender or a moderator. */
  body: string | null;
  isHidden: boolean;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  isGroup: boolean;
  name: string | null;
  /** True while this 1:1 thread is a pending Message Request. */
  isRequest: boolean;
  initiatorId: string | null;
  /** Set when the viewer declined this pending request; hides it from the main Requests list. */
  archivedAt: string | null;
  /** Every participant except the viewer. */
  participants: { id: string; name: string; avatarUrl: string | null }[];
  lastMessage: {
    body: string | null;
    isHidden: boolean;
    senderId: string;
    senderName: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

// ---- Audit log AI summary ----

export interface AuditSummaryStats {
  totalActions: number;
  dateRange: { earliest: string | null; latest: string | null };
  byCategory: { ADMIN_ACTION: number; USER_ACTION: number };
  byAction: Array<{ action: string; count: number }>;
  byActor: Array<{ actorId: string; name: string; email: string; count: number }>;
  byTargetType: Array<{ targetType: string; count: number }>;
  uniqueActors: number;
  uniqueTargets: number;
  topRepeatedTargets: Array<{ targetId: string; targetType: string; count: number; actions: string[] }>;
  dailyVolume: Array<{ date: string; count: number }>;
}

export interface AuditSummaryNarrative {
  wentWell: string;
  needsWork: string;
  futureEventChanges: string;
  criticalFlags: string;
}

export interface AuditSummaryReport {
  stats: AuditSummaryStats;
  narrative: AuditSummaryNarrative | null;
}
