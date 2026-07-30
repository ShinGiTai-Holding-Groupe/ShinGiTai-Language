import type {
  NotificationCandidate,
  NotificationChannel,
  NotificationDecision,
  NotificationHistoryEntry,
  NotificationPreferences,
} from "./types";

const MINUTES_PER_DAY = 24 * 60;

function minuteOfDay(value: Date): number {
  return value.getHours() * 60 + value.getMinutes();
}

function isWithinQuietHours(minute: number, startMinute: number, endMinute: number): boolean {
  if (startMinute === endMinute) {
    return true;
  }

  if (startMinute < endMinute) {
    return minute >= startMinute && minute < endMinute;
  }

  return minute >= startMinute || minute < endMinute;
}

function isSameLocalDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function enabledRequestedChannels(
  candidate: NotificationCandidate,
  preferences: NotificationPreferences,
): NotificationChannel[] {
  return candidate.requestedChannels.filter((channel) =>
    preferences.enabledChannels.has(channel),
  );
}

export function decideNotification(
  candidate: NotificationCandidate,
  preferences: NotificationPreferences,
  history: readonly NotificationHistoryEntry[],
): NotificationDecision {
  if (preferences.disabledTypes.has(candidate.type)) {
    return { allowed: false, channels: [], reason: "type_disabled" };
  }

  const channels = enabledRequestedChannels(candidate, preferences);

  if (channels.length === 0) {
    const reason = candidate.requestedChannels.length === 0 ? "no_available_channel" : "channel_disabled";
    return { allowed: false, channels: [], reason };
  }

  const quietHours = preferences.quietHours;
  const normalizedMinute = ((minuteOfDay(candidate.scheduledAt) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;

  if (
    quietHours.enabled &&
    candidate.priority !== "critical" &&
    isWithinQuietHours(normalizedMinute, quietHours.startMinute, quietHours.endMinute)
  ) {
    return { allowed: false, channels: [], reason: "quiet_hours" };
  }

  const sentToday = history.filter((entry) => isSameLocalDay(entry.sentAt, candidate.scheduledAt)).length;

  if (candidate.priority !== "critical" && sentToday >= Math.max(0, preferences.dailyLimit)) {
    return { allowed: false, channels: [], reason: "daily_limit_reached" };
  }

  return { allowed: true, channels, reason: "allowed" };
}
