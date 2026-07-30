export type OfflineCapability =
  | "offline_full"
  | "offline_limited"
  | "online_required"
  | "online_preferred";

export type PendingCommandOperation = "create" | "update" | "delete" | "append";

export type PendingCommandStatus =
  | "pending"
  | "processing"
  | "retry_wait"
  | "conflict"
  | "quarantined"
  | "committed"
  | "failed";

export type ConflictStrategy =
  | "last_write_wins"
  | "server_wins"
  | "client_wins"
  | "merge"
  | "append_only"
  | "manual_resolution"
  | "domain_specific";

export type SyncStatus = "local_only" | "pending" | "syncing" | "synced" | "conflict" | "failed";

export type RetryClass = "temporary" | "authentication" | "validation" | "conflict" | "permanent";

export type PendingCommand<TPayload = unknown> = {
  commandId: string;
  userId: string;
  organizationId?: string;
  deviceId: string;
  entityType: string;
  entityId: string;
  operation: PendingCommandOperation;
  payload: TPayload;
  createdAt: string;
  retryCount: number;
  nextAttemptAt?: string;
  status: PendingCommandStatus;
  idempotencyKey: string;
  expectedServerRevision?: number;
  lastErrorCode?: string;
};

export type EntitySyncMetadata = {
  entityId: string;
  entityType: string;
  localRevision: number;
  serverRevision?: number;
  updatedAt: string;
  updatedByDevice: string;
  syncStatus: SyncStatus;
};

export type CanonicalEntity<TValue = unknown> = {
  entityId: string;
  entityType: string;
  value: TValue;
  serverRevision: number;
  updatedAt: string;
  updatedByDevice?: string;
};

export type LocalEntity<TValue = unknown> = {
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
  local: LocalEntity<TValue>;
  server: CanonicalEntity<TValue>;
};

export type ConflictResolution<TValue = unknown> = {
  status: "resolved" | "manual_required";
  value?: TValue;
  source: "local" | "server" | "merged" | "appended" | "manual";
  nextServerRevision?: number;
  reason: string;
};

export type SyncBatch<TPayload = unknown> = {
  deviceId: string;
  userId: string;
  organizationId?: string;
  sinceServerRevision?: number;
  commands: PendingCommand<TPayload>[];
};

export type SyncCommandResult = {
  commandId: string;
  status: "committed" | "retry" | "conflict" | "rejected";
  serverRevision?: number;
  retryAfterMs?: number;
  errorCode?: string;
};

export type SyncBatchResult<TValue = unknown> = {
  acceptedAt: string;
  latestServerRevision: number;
  commandResults: SyncCommandResult[];
  delta: CanonicalEntity<TValue>[];
};

export type DeviceRecord = {
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
  userId: string;
  deviceId: string;
  activityId: string;
  currentStep: string;
  lastSavedState: TState;
  issuedAt: string;
  expiresAt: string;
};
