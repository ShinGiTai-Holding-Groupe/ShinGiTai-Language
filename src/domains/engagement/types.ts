export type NotificationType =
  | "learning"
  | "review"
  | "goal"
  | "recovery"
  | "teacher"
  | "social"
  | "system"
  | "achievement";

export type NotificationPriority = "critical" | "important" | "normal" | "optional";
export type NotificationChannel = "in_app" | "push" | "email" | "desktop" | "calendar" | "teacher_dashboard";

export type QuietHours = { enabled: boolean; startMinute: number; endMinute: number };

export type NotificationPreferences = {
  tenantPartition: string;
  userId: string;
  enabledChannels: ReadonlySet<NotificationChannel>;
  disabledTypes: ReadonlySet<NotificationType>;
  quietHours: QuietHours;
  dailyLimit: number;
  timezone: string;
};

export type NotificationCandidate = {
  notificationId: string;
  tenantPartition: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  requestedChannels: readonly NotificationChannel[];
  scheduledAt: Date;
};

export type NotificationHistoryEntry = {
  notificationId: string;
  tenantPartition: string;
  userId: string;
  sentAt: Date;
  channel: NotificationChannel;
  type: NotificationType;
};

export type NotificationDecisionReason =
  | "allowed"
  | "type_disabled"
  | "channel_disabled"
  | "quiet_hours"
  | "daily_limit_reached"
  | "no_available_channel"
  | "tenant_mismatch";

export type NotificationDecision = { allowed: boolean; channels: readonly NotificationChannel[]; reason: NotificationDecisionReason };

export type LearningActivityEvidence = {
  meaningfulLearningDays: number;
  plannedLearningDays: number;
  completedRecoverySessions: number;
};

export type ExperienceSource = "lesson" | "review" | "assessment" | "speaking" | "writing" | "recovery" | "achievement";

export type ExperienceGrantRequest = {
  tenantPartition: string;
  userId: string;
  source: ExperienceSource;
  sourceId: string;
  baseAmount: number;
  idempotencyKey: string;
  semanticPayloadHash: string;
  occurredAt: Date;
};

export type ExperienceLedgerEntry = ExperienceGrantRequest & { entryId: string; grantedAmount: number };
