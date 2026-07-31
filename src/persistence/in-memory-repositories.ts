import {
  PersistenceConflictError,
  type AppendOnlyRecord,
  type AppendOnlyRepository,
  type EntityRepository,
  type RepositoryReadOptions,
  type RepositoryWriteResult,
  type VersionedEntity,
} from "./types";

interface StoredEntity<TEntity> {
  readonly entity: TEntity;
  readonly deleted: boolean;
}

export class InMemoryEntityRepository<TEntity extends VersionedEntity>
  implements EntityRepository<TEntity>
{
  private readonly records = new Map<string, StoredEntity<TEntity>>();

  async getById(
    id: string,
    options: RepositoryReadOptions = {},
  ): Promise<TEntity | null> {
    const record = this.records.get(id);
    if (!record) return null;
    if (record.deleted && !options.includeDeleted) return null;
    return structuredClone(record.entity);
  }

  async list(options: RepositoryReadOptions = {}): Promise<readonly TEntity[]> {
    return [...this.records.values()]
      .filter((record) => options.includeDeleted || !record.deleted)
      .map((record) => structuredClone(record.entity))
      .sort((left, right) => left.id.localeCompare(right.id));
  }

  async put(
    entity: TEntity,
    expectedVersion?: number,
  ): Promise<RepositoryWriteResult<TEntity>> {
    const current = this.records.get(entity.id);
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

    this.records.set(entity.id, {
      entity: structuredClone(entity),
      deleted: false,
    });

    return {
      entity: structuredClone(entity),
      created: current === undefined,
    };
  }

  async delete(id: string, expectedVersion?: number): Promise<boolean> {
    const current = this.records.get(id);
    if (!current) return false;

    if (
      expectedVersion !== undefined &&
      current.entity.version !== expectedVersion
    ) {
      throw new PersistenceConflictError(
        `Expected version ${expectedVersion} for ${id}, received ${current.entity.version}.`,
      );
    }

    if (current.deleted) return false;
    this.records.set(id, { ...current, deleted: true });
    return true;
  }
}

export class InMemoryAppendOnlyRepository<TRecord extends AppendOnlyRecord>
  implements AppendOnlyRepository<TRecord>
{
  private readonly records = new Map<string, TRecord>();

  async append(record: TRecord): Promise<boolean> {
    if (this.records.has(record.id)) return false;
    this.records.set(record.id, structuredClone(record));
    return true;
  }

  async getById(id: string): Promise<TRecord | null> {
    const record = this.records.get(id);
    return record ? structuredClone(record) : null;
  }

  async list(): Promise<readonly TRecord[]> {
    return [...this.records.values()]
      .map((record) => structuredClone(record))
      .sort((left, right) => {
        const byTime = left.createdAt.localeCompare(right.createdAt);
        return byTime !== 0 ? byTime : left.id.localeCompare(right.id);
      });
  }
}
