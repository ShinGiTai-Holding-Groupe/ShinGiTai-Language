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
    | "cycle_detected";
  readonly sourceModuleId: string;
  readonly targetModuleId?: string;
  readonly importedPath?: string;
  readonly message: string;
}

export interface ClockPort {
  now(): Date;
}

export interface IdGeneratorPort {
  generate(): string;
}
