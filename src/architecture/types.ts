export type ArchitectureLayer =
  | "ui"
  | "presentation"
  | "application"
  | "domain"
  | "ports"
  | "infrastructure";

export type ModuleKind = "bounded_context" | "shared_kernel" | "adapter" | "extension";

export interface ModuleDescriptor {
  readonly moduleId: string;
  readonly kind: ModuleKind;
  readonly layer: ArchitectureLayer;
  readonly publicEntrypoint: string;
  readonly ownsState: boolean;
  readonly allowedDependencies: readonly string[];
  readonly forbiddenDependencies?: readonly string[];
}

export interface DependencyEdge {
  readonly sourceModuleId: string;
  readonly targetModuleId: string;
  readonly importedPath: string;
  readonly typeOnly: boolean;
}

export interface BoundaryViolation {
  readonly code:
    | "unknown_source_module"
    | "unknown_target_module"
    | "layer_direction_violation"
    | "dependency_not_allowed"
    | "dependency_explicitly_forbidden"
    | "private_entrypoint_import"
    | "provider_dependency_forbidden"
    | "cycle_detected"
    | "missing_public_entrypoint";
  readonly sourceModuleId: string;
  readonly targetModuleId?: string;
  readonly importedPath?: string;
  readonly message: string;
}

export interface TenantContext {
  readonly tenantPartition: string;
  readonly userId: string;
  readonly organizationId?: string;
  readonly actorId: string;
  readonly actorType: "learner" | "hikari_teacher_runtime" | "system" | "administrator";
}

export interface PortRequestContext extends TenantContext {
  readonly requestId: string;
  readonly traceId?: string;
  readonly locale?: string;
  readonly signal?: AbortSignal;
}

export type PortResult<T> =
  | {
      readonly ok: true;
      readonly value: T;
      readonly executionReceiptId?: string;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: string;
        readonly message: string;
        readonly retryable: boolean;
      };
    };

export interface OdynAiApplicationPort<TRequest, TResponse> {
  execute(request: TRequest, context: PortRequestContext): Promise<PortResult<TResponse>>;
}

export interface ClockPort {
  now(): Date;
}

export interface IdGeneratorPort {
  generate(): string;
}

export interface KeyValuePort<T> {
  get(key: string, context: TenantContext): Promise<T | undefined>;
  set(key: string, value: T, context: TenantContext): Promise<void>;
  delete(key: string, context: TenantContext): Promise<void>;
}
