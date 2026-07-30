import type { PendingCommand, PendingCommandStatus, RetryClass } from "./types";

const TERMINAL_STATUSES = new Set<PendingCommandStatus>(["committed", "failed", "quarantined"]);

export function enqueueCommand<TPayload>(
  ledger: readonly PendingCommand<TPayload>[],
  command: PendingCommand<TPayload>,
): PendingCommand<TPayload>[] {
  const duplicate = ledger.find((item) => item.idempotencyKey === command.idempotencyKey);

  if (duplicate) {
    return [...ledger];
  }

  if (!command.commandId.trim() || !command.userId.trim() || !command.deviceId.trim()) {
    throw new Error("Pending command identity is incomplete");
  }

  if (!command.entityType.trim() || !command.entityId.trim()) {
    throw new Error("Pending command entity identity is incomplete");
  }

  return [...ledger, { ...command, status: "pending", retryCount: Math.max(0, command.retryCount) }];
}

export function selectReadyCommands<TPayload>(
  ledger: readonly PendingCommand<TPayload>[],
  now: Date,
  limit: number,
): PendingCommand<TPayload>[] {
  if (!Number.isInteger(limit) || limit < 1) {
    return [];
  }

  const nowMs = now.getTime();

  return ledger
    .filter((command) => {
      if (command.status !== "pending" && command.status !== "retry_wait") {
        return false;
      }

      return !command.nextAttemptAt || new Date(command.nextAttemptAt).getTime() <= nowMs;
    })
    .sort((left, right) => {
      const created = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      return created !== 0 ? created : left.commandId.localeCompare(right.commandId);
    })
    .slice(0, limit);
}

export function transitionCommand<TPayload>(
  command: PendingCommand<TPayload>,
  status: PendingCommandStatus,
  patch: Partial<Pick<PendingCommand<TPayload>, "nextAttemptAt" | "lastErrorCode" | "expectedServerRevision">> = {},
): PendingCommand<TPayload> {
  if (TERMINAL_STATUSES.has(command.status) && command.status !== status) {
    throw new Error(`Cannot transition terminal command ${command.commandId}`);
  }

  return { ...command, ...patch, status };
}

export function classifyRetry(errorCode: string): RetryClass {
  if (/^(401|403|AUTH_|SESSION_)/.test(errorCode)) return "authentication";
  if (/^(409|CONFLICT_|REVISION_)/.test(errorCode)) return "conflict";
  if (/^(400|422|VALIDATION_|SCHEMA_)/.test(errorCode)) return "validation";
  if (/^(429|5\d\d|TIMEOUT|NETWORK|TEMP_)/.test(errorCode)) return "temporary";
  return "permanent";
}

export function scheduleRetry<TPayload>(
  command: PendingCommand<TPayload>,
  errorCode: string,
  now: Date,
  maximumRetries = 8,
): PendingCommand<TPayload> {
  const retryClass = classifyRetry(errorCode);
  const retryCount = command.retryCount + 1;

  if (retryClass === "validation") {
    return { ...command, status: "quarantined", retryCount, lastErrorCode: errorCode };
  }

  if (retryClass === "conflict") {
    return { ...command, status: "conflict", retryCount, lastErrorCode: errorCode };
  }

  if (retryClass === "permanent" || retryCount > maximumRetries) {
    return { ...command, status: "failed", retryCount, lastErrorCode: errorCode };
  }

  const baseDelayMs = retryClass === "authentication" ? 5_000 : 1_000;
  const delayMs = Math.min(baseDelayMs * 2 ** Math.min(retryCount - 1, 8), 15 * 60_000);

  return {
    ...command,
    status: "retry_wait",
    retryCount,
    lastErrorCode: errorCode,
    nextAttemptAt: new Date(now.getTime() + delayMs).toISOString(),
  };
}
