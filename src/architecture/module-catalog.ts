import type { ModuleDescriptor } from "./types";
export const LANGUAGE_MODULES: readonly ModuleDescriptor[] = [
  {
    moduleId: "shared",
    kind: "shared_kernel",
    layer: "domain",
    publicEntrypoint: "src/domains/shared/index",
    ownsState: false,
    allowedDependencies: [],
  },
  {
    moduleId: "learning-evidence",
    kind: "bounded_context",
    layer: "domain",
    publicEntrypoint: "src/domains/learning-evidence/index",
    ownsState: true,
    allowedDependencies: ["shared"],
  },
  {
    moduleId: "assessment",
    kind: "bounded_context",
    layer: "domain",
    publicEntrypoint: "src/domains/assessment/index",
    ownsState: true,
    allowedDependencies: ["shared", "learning-evidence"],
  },
  {
    moduleId: "promotion",
    kind: "bounded_context",
    layer: "domain",
    publicEntrypoint: "src/domains/promotion/index",
    ownsState: true,
    allowedDependencies: ["shared", "assessment"],
  },
  {
    moduleId: "pedagogical-memory",
    kind: "bounded_context",
    layer: "domain",
    publicEntrypoint: "src/domains/pedagogical-memory/index",
    ownsState: true,
    allowedDependencies: ["shared"],
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
