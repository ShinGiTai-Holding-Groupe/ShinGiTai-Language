export interface TenantScope {
  readonly tenantPartition: string;
  readonly userId?: string;
  readonly organizationId?: string;
}

export interface VersionedEntity extends TenantScope {
  readonly id: string;
  readonly version: number;
  readonly updatedAt: string;
}

export interface RepositoryReadOptions extends TenantScope {
  readonly includeDeleted?: boolean;
}

export interface RepositoryWriteResult<TEntity> {
  readonly entity: TEntity;
  readonly created: boolean;
}

export interface EntityRepository<TEntity extends VersionedEntity> {
  getById(id: string, scope: TenantScope, options?: Omit<RepositoryReadOptions, keyof TenantScope>): Promise<TEntity | null>;
  list(scope: TenantScope, options?: Omit<RepositoryReadOptions, keyof TenantScope>): Promise<readonly TEntity[]>;
  put(entity: TEntity, scope: TenantScope, expectedVersion?: number): Promise<RepositoryWriteResult<TEntity>>;
  delete(id: string, scope: TenantScope, expectedVersion?: number): Promise<boolean>;
}

export interface AppendOnlyRecord extends TenantScope {
  readonly id: string;
  readonly createdAt: string;
  readonly idempotencyKey?: string;
  readonly semanticPayloadHash?: string;
}

export interface AppendOnlyRepository<TRecord extends AppendOnlyRecord> {
  append(record: TRecord, scope: TenantScope): Promise<boolean>;
  getById(id: string, scope: TenantScope): Promise<TRecord | null>;
  list(scope: TenantScope): Promise<readonly TRecord[]>;
}

export interface DomainEventRecord extends AppendOnlyRecord {
  readonly aggregateId: string;
  readonly aggregateVersion: number;
  readonly eventType: string;
  readonly payload: unknown;
}

export interface OutboxRecord extends AppendOnlyRecord {
  readonly eventId: string;
  readonly status: "pending" | "published" | "failed";
}

export interface TransactionalPersistencePort<TEntity extends VersionedEntity> {
  commit(input: {
    scope: TenantScope;
    entity: TEntity;
    expectedVersion?: number;
    events: readonly DomainEventRecord[];
    outbox: readonly OutboxRecord[];
  }): Promise<RepositoryWriteResult<TEntity>>;
}

export class PersistenceConflictError extends Error {
  readonly code = "persistence_conflict";
  constructor(message: string) {
    super(message);
    this.name = "PersistenceConflictError";
  }
}

export class PersistenceTenantViolationError extends Error {
  readonly code = "persistence_tenant_violation";
  constructor(message: string) {
    super(message);
    this.name = "PersistenceTenantViolationError";
  }
}
