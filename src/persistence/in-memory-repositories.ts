import {
  PersistenceConflictError,
  PersistenceTenantViolationError,
  type AppendOnlyRecord,
  type AppendOnlyRepository,
  type EntityRepository,
  type RepositoryReadOptions,
  type RepositoryWriteResult,
  type TenantScope,
  type VersionedEntity,
} from "./types";

interface StoredEntity<TEntity> {
  readonly entity: TEntity;
  readonly deleted: boolean;
}

function key(scope: TenantScope, id: string): string {
  return `${scope.tenantPartition}:${id}`;
}

function assertScopeMatches(entity: TenantScope, scope: TenantScope): void {
  if (entity.tenantPartition !== scope.tenantPartition) {
    throw new PersistenceTenantViolationError("Entity tenantPartition does not match repository scope.");
  }
  if (scope.userId && entity.userId && entity.userId !== scope.userId) {
    throw new PersistenceTenantViolationError("Entity userId does not match repository scope.");
  }
  if (scope.organizationId && entity.organizationId && entity.organizationId !== scope.organizationId) {
    throw new PersistenceTenantViolationError("Entity organizationId does not match repository scope.");
  }
}

/** TEST-ONLY ADAPTER. Production persistence must use a transactional adapter. */
export class InMemoryEntityRepository<TEntity extends VersionedEntity>
  implements EntityRepository<TEntity>
{
  private readonly records = new Map<string, StoredEntity<TEntity>>();

  async getById(
    id: string,
    scope: TenantScope,
    options: Omit<RepositoryReadOptions, keyof TenantScope> = {},
  ): Promise<TEntity | null> {
    const record = this.records.get(key(scope, id));
    if (!record) return null;
    assertScopeMatches(record.entity, scope);
    if (record.deleted && !options.includeDeleted) return null;
    return structuredClone(record.entity);
  }

  async list(
    scope: TenantScope,
    options: Omit<RepositoryReadOptions, keyof TenantScope> = {},
  ): Promise<readonly TEntity[]> {
    return [...this.records.values()]
      .filter((record) => record.entity.tenantPartition === scope.tenantPartition)
      .filter((record) => !scope.userId || !record.entity.userId || record.entity.userId === scope.userId)
      .filter(
        (record) =>
          !scope.organizationId ||
          !record.entity.organizationId ||
          record.entity.organizationId === scope.organizationId,
      )
      .filter((record) => options.includeDeleted || !record.deleted)
      .map((record) => structuredClone(record.entity))
      .sort((left, right) => left.id.localeCompare(right.id));
  }

  async put(
    entity: TEntity,
    scope: TenantScope,
    expectedVersion?: number,
  ): Promise<RepositoryWriteResult<TEntity>> {
    assertScopeMatches(entity, scope);
    const recordKey = key(scope, entity.id);
    const current = this.records.get(recordKey);
    const currentVersion = current?.entity.version;

    if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
      throw new PersistenceConflictError(
        `Expected version ${expectedVersion} for ${entity.id}, received ${String(currentVersion)}.`,
      );
    }
    if (current && entity.version <= current.entity.version) {
      throw new PersistenceConflictError(
        `Version ${entity.version} must be greater than ${current.entity.version} for ${entity.id}.`,
      );
    }

    this.records.set(recordKey, { entity: structuredClone(entity), deleted: false });
    return { entity: structuredClone(entity), created: current === undefined };
  }

  async delete(id: string, scope: TenantScope, expectedVersion?: number): Promise<boolean> {
    const recordKey = key(scope, id);
    const current = this.records.get(recordKey);
    if (!current) return false;
    assertScopeMatches(current.entity, scope);
    if (expectedVersion !== undefined && current.entity.version !== expectedVersion) {
      throw new PersistenceConflictError(
        `Expected version ${expectedVersion} for ${id}, received ${current.entity.version}.`,
      );
    }
    if (current.deleted) return false;
    this.records.set(recordKey, { ...current, deleted: true });
    return true;
  }
}

/** TEST-ONLY ADAPTER. Production persistence must use a transactional adapter. */
export class InMemoryAppendOnlyRepository<TRecord extends AppendOnlyRecord>
  implements AppendOnlyRepository<TRecord>
{
  private readonly records = new Map<string, TRecord>();
  private readonly idempotency = new Map<string, string>();

  async append(record: TRecord, scope: TenantScope): Promise<boolean> {
    assertScopeMatches(record, scope);
    const recordKey = key(scope, record.id);
    if (this.records.has(recordKey)) return false;

    if (record.idempotencyKey) {
      const idempotencyKey = key(scope, record.idempotencyKey);
      const previousHash = this.idempotency.get(idempotencyKey);
      if (previousHash && previousHash !== record.semanticPayloadHash) {
        throw new PersistenceConflictError("IDEMPOTENCY_PAYLOAD_CONFLICT");
      }
      if (previousHash) return false;
      this.idempotency.set(idempotencyKey, record.semanticPayloadHash ?? "");
    }

    this.records.set(recordKey, structuredClone(record));
    return true;
  }

  async getById(id: string, scope: TenantScope): Promise<TRecord | null> {
    const record = this.records.get(key(scope, id));
    if (!record) return null;
    assertScopeMatches(record, scope);
    return structuredClone(record);
  }

  async list(scope: TenantScope): Promise<readonly TRecord[]> {
    return [...this.records.values()]
      .filter((record) => record.tenantPartition === scope.tenantPartition)
      .filter((record) => !scope.userId || !record.userId || record.userId === scope.userId)
      .filter(
        (record) =>
          !scope.organizationId || !record.organizationId || record.organizationId === scope.organizationId,
      )
      .map((record) => structuredClone(record))
      .sort((left, right) => {
        const byTime = left.createdAt.localeCompare(right.createdAt);
        return byTime !== 0 ? byTime : left.id.localeCompare(right.id);
      });
  }
}
