export type OfflineCapability =
  | "offline_full"
  | "offline_limited"
  | "online_required"
  | "online_preferred";

export type PendingCommandOperation = "create" | "update" | "delete" | "append";

export type PendingCommandStatus =
  | "local_pending"
  | "submitted"
  | "accepted"
  | "applied"
  | "retry_wait"
  | "conflicted"
  | "quarantined"
  | "rejected";

export type ConflictStrategy =
  | "server_wins"
  | "merge_noncanonical"
  | "append_only"
  | "manual_resolution"
  | "domain_specific";

export type SyncStatus = "local_only" | "pending" | "syncing" | "synced" | "conflict" | "failed";

export type RetryClass = "temporary" | "authentication" | "validation" | "conflict" | "permanent";

export type PendingCommand<TPayload = unknown> = {
  commandId: string;
  tenantPartition: string;
  userId: string;
  organizationId?: string;
  deviceId: string;
  entityType: string;
  entityId: string;
  operation: PendingCommandOperation;
  payload: TPayload;
  semanticPayloadHash: string;
  createdAt: string;
  retryCount: number;
  nextAttemptAt?: string;
  status: PendingCommandStatus;
  idempotencyKey: string;
  expectedServerRevision?: number;
  lastErrorCode?: string;
};

export type EntitySyncMetadata = {
  tenantPartition: string;
  entityId: string;
  entityType: string;
  localRevision: number;
  serverRevision?: number;
  updatedAt: string;
  updatedByDevice: string;
  syncStatus: SyncStatus;
};

export type CanonicalEntity<TValue = unknown> = {
  tenantPartition: string;
  entityId: string;
  entityType: string;
  value: TValue;
  serverRevision: number;
  updatedAt: string;
  updatedByDevice?: string;
};

export type LocalEntity<TValue = unknown> = {
  tenantPartition: string;
  entityId: string;
  entityType: string;
  value: TValue;
  localRevision: number;
  serverRevision?: number;
  updatedAt: string;
  updatedByDevice: string;
};

export type ConflictContext<TValue = unknown> = {
  strategy: ConflictStrategy;
  dataClass: "canonical_learning" | "append_only_history" | "noncanonical_preference" | "draft";
  local: LocalEntity<TValue>;
  server: CanonicalEntity<TValue>;
};

export type ConflictResolution<TValue = unknown> = {
  status: "resolved" | "manual_required" | "rejected";
  value?: TValue;
  source: "server" | "merged" | "appended" | "manual";
  reason: string;
};

export type SyncBatch<TPayload = unknown> = {
  tenantPartition: string;
  deviceId: string;
  userId: string;
  organizationId?: string;
  sinceServerRevision?: number;
  commands: PendingCommand<TPayload>[];
};

export type SyncCommandResult = {
  commandId: string;
  status: "accepted" | "applied" | "retry" | "conflicted" | "rejected" | "quarantined";
  serverRevision?: number;
  retryAfterMs?: number;
  errorCode?: string;
};

export type SyncBatchResult<TValue = unknown> = {
  tenantPartition: string;
  acceptedAt: string;
  latestServerRevision: number;
  commandResults: SyncCommandResult[];
  delta: CanonicalEntity<TValue>[];
};

export type DeviceRecord = {
  tenantPartition: string;
  deviceId: string;
  userId: string;
  deviceName: string;
  platform: string;
  appVersion: string;
  lastSeenAt: string;
  trustStatus: "trusted" | "untrusted" | "revoked";
};

export type ResumeToken<TState = unknown> = {
  token: string;
  tokenVersion: number;
  tenantPartition: string;
  userId: string;
  deviceId: string;
  activityId: string;
  currentStep: string;
  lastSavedState: TState;
  nonce: string;
  signature: string;
  issuedAt: string;
  expiresAt: string;
  revokedAt?: string;
};
