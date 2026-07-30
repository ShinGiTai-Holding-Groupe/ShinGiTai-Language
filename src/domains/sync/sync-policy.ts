import type {
  CanonicalEntity,
  DeviceRecord,
  OfflineCapability,
  ResumeToken,
  SyncBatch,
  SyncBatchResult,
} from "./types";

const ONLINE_REQUIRED = new Set([
  "cloud_ai_tutor",
  "full_speaking_evaluation",
  "dynamic_ai_generation",
  "billing",
  "multiplayer",
  "publishing",
  "certification_session",
  "high_risk_admin",
]);

const OFFLINE_FULL = new Set([
  "downloaded_lesson",
  "flashcards",
  "srs_review",
  "deterministic_quiz",
  "notes",
  "progress",
  "daily_plan",
  "cached_audio",
  "recent_history",
]);

export function resolveOfflineCapability(featureKey: string): OfflineCapability {
  if (ONLINE_REQUIRED.has(featureKey)) return "online_required";
  if (OFFLINE_FULL.has(featureKey)) return "offline_full";
  if (featureKey === "pronunciation" || featureKey === "hikari") return "offline_limited";
  return "online_preferred";
}

export function assertDeviceCanSync(device: DeviceRecord, userId: string): void {
  if (device.userId !== userId) {
    throw new Error("Device does not belong to the sync subject");
  }

  if (device.trustStatus === "revoked") {
    throw new Error("Device access has been revoked");
  }
}

export function validateSyncBatch(batch: SyncBatch, device: DeviceRecord): void {
  assertDeviceCanSync(device, batch.userId);

  if (batch.deviceId !== device.deviceId) {
    throw new Error("Sync batch device identity mismatch");
  }

  const commandIds = new Set<string>();
  const idempotencyKeys = new Set<string>();

  for (const command of batch.commands) {
    if (command.userId !== batch.userId || command.deviceId !== batch.deviceId) {
      throw new Error(`Command ${command.commandId} crosses user or device boundary`);
    }

    if (commandIds.has(command.commandId)) {
      throw new Error(`Duplicate command id ${command.commandId}`);
    }

    if (idempotencyKeys.has(command.idempotencyKey)) {
      throw new Error(`Duplicate idempotency key ${command.idempotencyKey}`);
    }

    commandIds.add(command.commandId);
    idempotencyKeys.add(command.idempotencyKey);
  }
}

export function selectDelta<TValue>(
  entities: readonly CanonicalEntity<TValue>[],
  sinceServerRevision = 0,
): CanonicalEntity<TValue>[] {
  return entities
    .filter((entity) => entity.serverRevision > sinceServerRevision)
    .sort((left, right) => {
      const revision = left.serverRevision - right.serverRevision;
      return revision !== 0 ? revision : left.entityId.localeCompare(right.entityId);
    });
}

export function buildSyncResult<TValue>(input: {
  acceptedAt: Date;
  commandResults: SyncBatchResult<TValue>["commandResults"];
  entities: readonly CanonicalEntity<TValue>[];
  sinceServerRevision?: number;
}): SyncBatchResult<TValue> {
  const delta = selectDelta(input.entities, input.sinceServerRevision);
  const latestServerRevision = input.entities.reduce(
    (latest, entity) => Math.max(latest, entity.serverRevision),
    input.sinceServerRevision ?? 0,
  );

  return {
    acceptedAt: input.acceptedAt.toISOString(),
    latestServerRevision,
    commandResults: [...input.commandResults],
    delta,
  };
}

export function validateResumeToken<TState>(
  token: ResumeToken<TState>,
  context: { userId: string; deviceId: string; now: Date },
): boolean {
  return (
    token.userId === context.userId &&
    token.deviceId === context.deviceId &&
    new Date(token.expiresAt).getTime() > context.now.getTime()
  );
}
