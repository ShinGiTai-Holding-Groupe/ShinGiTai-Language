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

export function assertDeviceCanSync(
  device: DeviceRecord,
  context: { tenantPartition: string; userId: string },
): void {
  if (device.tenantPartition !== context.tenantPartition || device.userId !== context.userId) {
    throw new Error("Device does not belong to the tenant-scoped sync subject");
  }
  if (device.trustStatus !== "trusted") throw new Error("Only trusted devices may synchronize");
}

export function validateSyncBatch(batch: SyncBatch, device: DeviceRecord): void {
  assertDeviceCanSync(device, batch);
  if (batch.deviceId !== device.deviceId) throw new Error("Sync batch device identity mismatch");

  const commandIds = new Set<string>();
  const idempotency = new Map<string, string>();
  for (const command of batch.commands) {
    if (
      command.tenantPartition !== batch.tenantPartition ||
      command.userId !== batch.userId ||
      command.deviceId !== batch.deviceId
    ) {
      throw new Error(`Command ${command.commandId} crosses tenant, user or device boundary`);
    }
    if (!command.semanticPayloadHash.trim())
      throw new Error(`Command ${command.commandId} lacks payload hash`);
    if (commandIds.has(command.commandId))
      throw new Error(`Duplicate command id ${command.commandId}`);

    const previousHash = idempotency.get(command.idempotencyKey);
    if (previousHash && previousHash !== command.semanticPayloadHash) {
      throw new Error(`IDEMPOTENCY_PAYLOAD_CONFLICT:${command.idempotencyKey}`);
    }
    if (previousHash) throw new Error(`Duplicate idempotency key ${command.idempotencyKey}`);

    commandIds.add(command.commandId);
    idempotency.set(command.idempotencyKey, command.semanticPayloadHash);
  }
}

export function selectDelta<TValue>(
  entities: readonly CanonicalEntity<TValue>[],
  tenantPartition: string,
  sinceServerRevision = 0,
): CanonicalEntity<TValue>[] {
  return entities
    .filter(
      (entity) =>
        entity.tenantPartition === tenantPartition && entity.serverRevision > sinceServerRevision,
    )
    .sort((left, right) => {
      const revision = left.serverRevision - right.serverRevision;
      return revision !== 0 ? revision : left.entityId.localeCompare(right.entityId);
    });
}

export function buildSyncResult<TValue>(input: {
  tenantPartition: string;
  acceptedAt: Date;
  commandResults: SyncBatchResult<TValue>["commandResults"];
  entities: readonly CanonicalEntity<TValue>[];
  sinceServerRevision?: number;
}): SyncBatchResult<TValue> {
  const delta = selectDelta(input.entities, input.tenantPartition, input.sinceServerRevision);
  const latestServerRevision = delta.reduce(
    (latest, entity) => Math.max(latest, entity.serverRevision),
    input.sinceServerRevision ?? 0,
  );
  return {
    tenantPartition: input.tenantPartition,
    acceptedAt: input.acceptedAt.toISOString(),
    latestServerRevision,
    commandResults: [...input.commandResults],
    delta,
  };
}

export function validateResumeToken<TState>(
  token: ResumeToken<TState>,
  context: {
    tenantPartition: string;
    userId: string;
    deviceId: string;
    activityId: string;
    now: Date;
    verifySignature: (token: ResumeToken<TState>) => boolean;
  },
): boolean {
  const expiry = Date.parse(token.expiresAt);
  const issued = Date.parse(token.issuedAt);
  return (
    token.tokenVersion > 0 &&
    token.tenantPartition === context.tenantPartition &&
    token.userId === context.userId &&
    token.deviceId === context.deviceId &&
    token.activityId === context.activityId &&
    token.revokedAt === undefined &&
    token.nonce.length >= 16 &&
    token.signature.length >= 32 &&
    Number.isFinite(expiry) &&
    Number.isFinite(issued) &&
    issued <= context.now.getTime() &&
    expiry > context.now.getTime() &&
    context.verifySignature(token)
  );
}
