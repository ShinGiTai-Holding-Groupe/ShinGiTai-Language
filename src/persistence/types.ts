export interface VersionedEntity {
  readonly id: string;
  readonly version: number;
  readonly updatedAt: string;
}

export interface RepositoryReadOptions {
  readonly includeDeleted?: boolean;
}

export interface RepositoryWriteResult<TEntity> {
  readonly entity: TEntity;
  readonly created: boolean;
}

export interface EntityRepository<TEntity extends VersionedEntity> {
  getById(id: string, options?: RepositoryReadOptions): Promise<TEntity | null>;
  list(options?: RepositoryReadOptions): Promise<readonly TEntity[]>;
  put(entity: TEntity, expectedVersion?: number): Promise<RepositoryWriteResult<TEntity>>;
  delete(id: string, expectedVersion?: number): Promise<boolean>;
}

export interface AppendOnlyRecord {
  readonly id: string;
  readonly createdAt: string;
}

export interface AppendOnlyRepository<TRecord extends AppendOnlyRecord> {
  append(record: TRecord): Promise<boolean>;
  getById(id: string): Promise<TRecord | null>;
  list(): Promise<readonly TRecord[]>;
}

export class PersistenceConflictError extends Error {
  readonly code = "persistence_conflict";

  constructor(message: string) {
    super(message);
    this.name = "PersistenceConflictError";
  }
}
