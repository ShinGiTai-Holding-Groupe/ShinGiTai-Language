import type { ModuleDescriptor } from "./types";

export const LANGUAGE_MODULES: readonly ModuleDescriptor[] = [
  {
    moduleId: "engagement",
    kind: "bounded_context",
    layer: "domain",
    publicEntrypoint: "src/domains/engagement/index",
    ownsState: true,
    allowedDependencies: [],
  },
  {
    moduleId: "entitlements",
    kind: "bounded_context",
    layer: "domain",
    publicEntrypoint: "src/domains/entitlements/index",
    ownsState: true,
    allowedDependencies: [],
  },
  {
    moduleId: "governance",
    kind: "bounded_context",
    layer: "domain",
    publicEntrypoint: "src/domains/governance/index",
    ownsState: true,
    allowedDependencies: [],
  },
  {
    moduleId: "observability",
    kind: "bounded_context",
    layer: "domain",
    publicEntrypoint: "src/domains/observability/index",
    ownsState: false,
    allowedDependencies: [],
  },
  {
    moduleId: "sync",
    kind: "bounded_context",
    layer: "domain",
    publicEntrypoint: "src/domains/sync/index",
    ownsState: true,
    allowedDependencies: [],
  },
  {
    moduleId: "accessibility",
    kind: "bounded_context",
    layer: "domain",
    publicEntrypoint: "src/domains/accessibility/index",
    ownsState: true,
    allowedDependencies: [],
  },
  {
    moduleId: "architecture",
    kind: "shared_kernel",
    layer: "ports",
    publicEntrypoint: "src/architecture/index",
    ownsState: false,
    allowedDependencies: [],
  },
];

export function getModuleDescriptor(moduleId: string): ModuleDescriptor | undefined {
  return LANGUAGE_MODULES.find((module) => module.moduleId === moduleId);
}
