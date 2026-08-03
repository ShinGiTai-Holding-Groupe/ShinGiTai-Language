import type {
  NotificationCandidate,
  NotificationChannel,
  NotificationDecision,
  NotificationHistoryEntry,
  NotificationPreferences,
} from "./types";

const MINUTES_PER_DAY = 24 * 60;

function validateTimezone(timezone: string): void {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date(0));
  } catch {
    throw new Error(`Invalid IANA timezone: ${timezone}`);
  }
}

function localParts(value: Date, timezone: string): { dayKey: string; minute: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  return {
    dayKey: `${get("year")}-${get("month")}-${get("day")}`,
    minute: hour * 60 + minute,
  };
}

function isWithinQuietHours(minute: number, startMinute: number, endMinute: number): boolean {
  if (startMinute === endMinute) return false;
  if (startMinute < endMinute) return minute >= startMinute && minute < endMinute;
  return minute >= startMinute || minute < endMinute;
}

function enabledRequestedChannels(
  candidate: NotificationCandidate,
  preferences: NotificationPreferences,
): NotificationChannel[] {
  return [...new Set(candidate.requestedChannels)].filter((channel) =>
    preferences.enabledChannels.has(channel),
  );
}

export function decideNotification(
  candidate: NotificationCandidate,
  preferences: NotificationPreferences,
  history: readonly NotificationHistoryEntry[],
): NotificationDecision {
  if (
    candidate.tenantPartition !== preferences.tenantPartition ||
    candidate.userId !== preferences.userId
  ) {
    return { allowed: false, channels: [], reason: "tenant_mismatch" };
  }
  validateTimezone(preferences.timezone);
  if (!Number.isInteger(preferences.dailyLimit) || preferences.dailyLimit < 0) {
    throw new Error("dailyLimit must be a non-negative integer");
  }

  if (preferences.disabledTypes.has(candidate.type)) {
    return { allowed: false, channels: [], reason: "type_disabled" };
  }

  const channels = enabledRequestedChannels(candidate, preferences);
  if (channels.length === 0) {
    return {
      allowed: false,
      channels: [],
      reason: candidate.requestedChannels.length === 0 ? "no_available_channel" : "channel_disabled",
    };
  }

  const quietHours = preferences.quietHours;
  const { dayKey, minute } = localParts(candidate.scheduledAt, preferences.timezone);
  const normalizedMinute = ((minute % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  if (
    quietHours.enabled &&
    candidate.priority !== "critical" &&
    isWithinQuietHours(normalizedMinute, quietHours.startMinute, quietHours.endMinute)
  ) {
    return { allowed: false, channels: [], reason: "quiet_hours" };
  }

  const notificationIdsToday = new Set(
    history
      .filter(
        (entry) =>
          entry.tenantPartition === candidate.tenantPartition &&
          entry.userId === candidate.userId &&
          localParts(entry.sentAt, preferences.timezone).dayKey === dayKey,
      )
      .map((entry) => entry.notificationId),
  );

  if (candidate.priority !== "critical" && notificationIdsToday.size >= preferences.dailyLimit) {
    return { allowed: false, channels: [], reason: "daily_limit_reached" };
  }

  return { allowed: true, channels, reason: "allowed" };
}
