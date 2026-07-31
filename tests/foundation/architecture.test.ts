import {
  detectDependencyCycles,
  getExtensionsByCapability,
  registerExtension,
  unregisterExtension,
  validateArchitecture,
  validateDependencyEdge,
  type DependencyEdge,
  type ExtensionManifest,
  type ExtensionRegistry,
  type ModuleDescriptor,
} from "../../src/architecture";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function module(input: Partial<ModuleDescriptor> & Pick<ModuleDescriptor, "moduleId" | "layer">): ModuleDescriptor {
  return {
    kind: "bounded_context",
    publicEntrypoint: `src/${input.moduleId}/index`,
    ownsState: false,
    allowedDependencies: [],
    ...input,
  };
}

function edge(
  sourceModuleId: string,
  targetModuleId: string,
  importedPath: string,
): DependencyEdge {
  return { sourceModuleId, targetModuleId, importedPath, typeOnly: false };
}

function violationCodes(violations: readonly { code: string }[]): string[] {
  return violations.map((violation) => violation.code);
}

function testDependencyBoundaries(): void {
  const modules: ModuleDescriptor[] = [
    module({
      moduleId: "learning",
      layer: "domain",
      allowedDependencies: ["ports"],
      forbiddenDependencies: ["ui"],
    }),
    module({ moduleId: "ports", layer: "ports" }),
    module({ moduleId: "ui", layer: "ui" }),
  ];

  assert(
    validateDependencyEdge(
      modules,
      edge("learning", "ports", "src/ports/index"),
    ).length === 0,
    "Declared inward dependency through a public entrypoint must be accepted.",
  );

  const privateImport = validateDependencyEdge(
    modules,
    edge("learning", "ports", "src/ports/runtime-port"),
  );
  assert(
    violationCodes(privateImport).includes("private_entrypoint_import"),
    "Cross-module private imports must be rejected.",
  );

  const outerDependency = validateDependencyEdge(
    modules,
    edge("learning", "ui", "src/ui/index"),
  );
  const outerCodes = violationCodes(outerDependency);
  assert(
    outerCodes.includes("layer_direction_violation"),
    "Domain modules must not depend on outer UI modules.",
  );
  assert(
    outerCodes.includes("dependency_not_allowed"),
    "Undeclared dependencies must be rejected.",
  );
  assert(
    outerCodes.includes("dependency_explicitly_forbidden"),
    "Explicitly forbidden dependencies must be rejected.",
  );

  const providerDependency = validateDependencyEdge(
    modules,
    edge("learning", "ports", "src/openai/providers/chat"),
  );
  assert(
    violationCodes(providerDependency).includes("provider_dependency_forbidden"),
    "Physical provider imports must be rejected.",
  );

  assert(
    violationCodes(
      validateDependencyEdge(modules, edge("missing", "ports", "src/ports/index")),
    ).includes("unknown_source_module"),
    "Unknown source modules must be reported.",
  );
  assert(
    violationCodes(
      validateDependencyEdge(modules, edge("learning", "missing", "src/missing/index")),
    ).includes("unknown_target_module"),
    "Unknown target modules must be reported.",
  );
}

function testCycleDetection(): void {
  const modules: ModuleDescriptor[] = [
    module({ moduleId: "a", layer: "domain", allowedDependencies: ["b"] }),
    module({ moduleId: "b", layer: "domain", allowedDependencies: ["c"] }),
    module({ moduleId: "c", layer: "domain", allowedDependencies: ["a"] }),
  ];
  const edges = [
    edge("a", "b", "src/b/index"),
    edge("b", "c", "src/c/index"),
    edge("c", "a", "src/a/index"),
  ];

  const cycles = detectDependencyCycles(modules, edges);
  assert(cycles.length >= 1, "Dependency cycle must be detected.");
  assert(
    cycles.every((violation) => violation.code === "cycle_detected"),
    "Cycle detector must emit only cycle violations.",
  );

  const fullValidation = validateArchitecture(modules, edges);
  assert(
    violationCodes(fullValidation).includes("cycle_detected"),
    "Aggregate architecture validation must include cycle detection.",
  );
}

function manifest(overrides: Partial<ExtensionManifest> = {}): ExtensionManifest {
  return {
    extensionId: "lesson.renderer.basic",
    version: "1.0.0",
    apiVersion: "v1",
    capabilities: ["lesson_renderer"],
    trusted: true,
    enabled: true,
    ...overrides,
  };
}

function testExtensionRegistry(): void {
  const empty: ExtensionRegistry<string> = { registrations: new Map() };
  const accepted = registerExtension(
    empty,
    { manifest: manifest(), implementation: "renderer" },
    "v1",
    "lesson_renderer",
  );
  assert(accepted.result.accepted, "Trusted compatible extension must be accepted.");
  assert(accepted.registry.registrations.size === 1, "Accepted extension must be registered.");
  assert(empty.registrations.size === 0, "Registration must not mutate the input registry.");

  const duplicate = registerExtension(
    accepted.registry,
    { manifest: manifest(), implementation: "duplicate" },
    "v1",
    "lesson_renderer",
  );
  assert(
    !duplicate.result.accepted && duplicate.result.reason === "duplicate_extension",
    "Duplicate extension IDs must be rejected.",
  );

  const disabled = registerExtension(
    empty,
    { manifest: manifest({ extensionId: "disabled", enabled: false }), implementation: "x" },
    "v1",
    "lesson_renderer",
  );
  assert(!disabled.result.accepted && disabled.result.reason === "disabled", "Disabled extension must be rejected.");

  const untrusted = registerExtension(
    empty,
    { manifest: manifest({ extensionId: "untrusted", trusted: false }), implementation: "x" },
    "v1",
    "lesson_renderer",
  );
  assert(!untrusted.result.accepted && untrusted.result.reason === "untrusted", "Untrusted extension must be rejected.");

  const incompatible = registerExtension(
    empty,
    { manifest: manifest({ extensionId: "old", apiVersion: "v0" }), implementation: "x" },
    "v1",
    "lesson_renderer",
  );
  assert(
    !incompatible.result.accepted && incompatible.result.reason === "api_version_mismatch",
    "Incompatible API versions must be rejected.",
  );

  const undeclared = registerExtension(
    empty,
    { manifest: manifest({ extensionId: "wrong-capability" }), implementation: "x" },
    "v1",
    "analytics_sink",
  );
  assert(
    !undeclared.result.accepted && undeclared.result.reason === "capability_not_declared",
    "Extensions must declare the required capability.",
  );

  const second = registerExtension(
    accepted.registry,
    {
      manifest: manifest({
        extensionId: "lesson.renderer.advanced",
        capabilities: ["lesson_renderer", "exercise_type"],
      }),
      implementation: "advanced",
    },
    "v1",
    "lesson_renderer",
  );
  const lessonRenderers = getExtensionsByCapability(second.registry, "lesson_renderer");
  assert(
    lessonRenderers.map((item) => item.manifest.extensionId).join(",") ===
      "lesson.renderer.advanced,lesson.renderer.basic",
    "Capability queries must be deterministic and sorted by extension ID.",
  );

  const removed = unregisterExtension(second.registry, "lesson.renderer.basic");
  assert(removed.registrations.size === 1, "Unregister must remove an existing extension.");
  assert(
    unregisterExtension(removed, "missing") === removed,
    "Unregistering a missing extension must preserve registry identity.",
  );
}

testDependencyBoundaries();
testCycleDetection();
testExtensionRegistry();
console.log("Foundation architecture contract tests passed.");
