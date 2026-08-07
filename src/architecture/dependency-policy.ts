import type {
  ArchitectureLayer,
  BoundaryViolation,
  DependencyEdge,
  ModuleDescriptor,
} from "./types";

const LAYER_ORDER: Readonly<Record<ArchitectureLayer, number>> = {
  ui: 0,
  presentation: 1,
  application: 2,
  domain: 3,
  ports: 4,
  infrastructure: 5,
};

const PHYSICAL_PROVIDER_PATTERNS = [
  /openai/i,
  /anthropic/i,
  /gemini/i,
  /ollama/i,
  /huggingface/i,
  /provider[s]?\//i,
  /shinrei\/providers/i,
];

function byId(modules: readonly ModuleDescriptor[]): ReadonlyMap<string, ModuleDescriptor> {
  return new Map(modules.map((module) => [module.moduleId, module]));
}

function isPublicEntrypoint(target: ModuleDescriptor, importedPath: string): boolean {
  const normalized = importedPath.replace(/\\/g, "/").replace(/\.(ts|tsx|js|jsx)$/, "");
  const publicPath = target.publicEntrypoint.replace(/\\/g, "/").replace(/\.(ts|tsx|js|jsx)$/, "");
  return normalized === publicPath || normalized.endsWith(`/${publicPath}`);
}

export function validateDependencyEdge(
  modules: readonly ModuleDescriptor[],
  edge: DependencyEdge,
): readonly BoundaryViolation[] {
  const registry = byId(modules);
  const source = registry.get(edge.sourceModuleId);
  const target = registry.get(edge.targetModuleId);
  const violations: BoundaryViolation[] = [];

  if (!source) {
    return [{
      code: "unknown_source_module",
      sourceModuleId: edge.sourceModuleId,
      targetModuleId: edge.targetModuleId,
      importedPath: edge.importedPath,
      message: `Unknown source module: ${edge.sourceModuleId}`,
    }];
  }

  if (!target) {
    return [{
      code: "unknown_target_module",
      sourceModuleId: edge.sourceModuleId,
      targetModuleId: edge.targetModuleId,
      importedPath: edge.importedPath,
      message: `Unknown target module: ${edge.targetModuleId}`,
    }];
  }

  if (PHYSICAL_PROVIDER_PATTERNS.some((pattern) => pattern.test(edge.importedPath))) {
    violations.push({
      code: "provider_dependency_forbidden",
      sourceModuleId: source.moduleId,
      targetModuleId: target.moduleId,
      importedPath: edge.importedPath,
      message: "Product modules must not depend on physical AI providers.",
    });
  }

  const sourceOrder = LAYER_ORDER[source.layer];
  const targetOrder = LAYER_ORDER[target.layer];
  if (source.kind !== "adapter" && targetOrder < sourceOrder) {
    violations.push({
      code: "layer_direction_violation",
      sourceModuleId: source.moduleId,
      targetModuleId: target.moduleId,
      importedPath: edge.importedPath,
      message: `${source.layer} cannot depend on the outer ${target.layer} layer.`,
    });
  }

  if (!source.allowedDependencies.includes(target.moduleId)) {
    violations.push({
      code: "dependency_not_allowed",
      sourceModuleId: source.moduleId,
      targetModuleId: target.moduleId,
      importedPath: edge.importedPath,
      message: `${source.moduleId} does not declare ${target.moduleId} as an allowed dependency.`,
    });
  }

  if (source.forbiddenDependencies?.includes(target.moduleId)) {
    violations.push({
      code: "dependency_explicitly_forbidden",
      sourceModuleId: source.moduleId,
      targetModuleId: target.moduleId,
      importedPath: edge.importedPath,
      message: `${source.moduleId} explicitly forbids ${target.moduleId}.`,
    });
  }

  if (source.moduleId !== target.moduleId && !isPublicEntrypoint(target, edge.importedPath)) {
    violations.push({
      code: "private_entrypoint_import",
      sourceModuleId: source.moduleId,
      targetModuleId: target.moduleId,
      importedPath: edge.importedPath,
      message: `Cross-module imports must use ${target.publicEntrypoint}.`,
    });
  }

  return violations;
}

export function detectDependencyCycles(
  modules: readonly ModuleDescriptor[],
  edges: readonly DependencyEdge[],
): readonly BoundaryViolation[] {
  const graph = new Map<string, string[]>();
  for (const module of modules) graph.set(module.moduleId, []);
  for (const edge of edges) graph.get(edge.sourceModuleId)?.push(edge.targetModuleId);

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const violations: BoundaryViolation[] = [];

  const visit = (moduleId: string, path: readonly string[]): void => {
    if (visiting.has(moduleId)) {
      const cycleStart = path.indexOf(moduleId);
      const cycle = [...path.slice(cycleStart), moduleId];
      violations.push({
        code: "cycle_detected",
        sourceModuleId: moduleId,
        message: `Dependency cycle detected: ${cycle.join(" -> ")}`,
      });
      return;
    }
    if (visited.has(moduleId)) return;

    visiting.add(moduleId);
    for (const target of graph.get(moduleId) ?? []) visit(target, [...path, moduleId]);
    visiting.delete(moduleId);
    visited.add(moduleId);
  };

  for (const module of modules) visit(module.moduleId, []);
  return violations;
}

export function validateArchitecture(
  modules: readonly ModuleDescriptor[],
  edges: readonly DependencyEdge[],
): readonly BoundaryViolation[] {
  return [
    ...edges.flatMap((edge) => validateDependencyEdge(modules, edge)),
    ...detectDependencyCycles(modules, edges),
  ];
}
