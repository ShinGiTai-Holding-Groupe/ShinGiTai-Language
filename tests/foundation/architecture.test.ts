import {
  detectDependencyCycles,
  validateDependencyEdge,
} from "../../src/architecture/dependency-policy";
import { LANGUAGE_MODULES } from "../../src/architecture/module-catalog";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const providerViolations = validateDependencyEdge(LANGUAGE_MODULES, {
  sourceModuleId: "assessment",
  targetModuleId: "learning-evidence",
  importedPath: "@ai-sdk/openai",
  typeOnly: false,
});
assert(
  providerViolations.some(({ code }) => code === "provider_dependency_forbidden"),
  "physical provider dependencies must be rejected",
);

const privateImportViolations = validateDependencyEdge(LANGUAGE_MODULES, {
  sourceModuleId: "assessment",
  targetModuleId: "learning-evidence",
  importedPath: "src/domains/learning-evidence/learning-evidence",
  typeOnly: true,
});
assert(
  privateImportViolations.some(({ code }) => code === "private_entrypoint_import"),
  "cross-domain private imports must be rejected",
);

const publicImportViolations = validateDependencyEdge(LANGUAGE_MODULES, {
  sourceModuleId: "assessment",
  targetModuleId: "learning-evidence",
  importedPath: "src/domains/learning-evidence/index",
  typeOnly: true,
});
assert(publicImportViolations.length === 0, "declared public domain dependencies must pass");

const cycleViolations = detectDependencyCycles(LANGUAGE_MODULES, [
  {
    sourceModuleId: "assessment",
    targetModuleId: "learning-evidence",
    importedPath: "src/domains/learning-evidence/index",
    typeOnly: true,
  },
  {
    sourceModuleId: "learning-evidence",
    targetModuleId: "assessment",
    importedPath: "src/domains/assessment/index",
    typeOnly: true,
  },
]);
assert(
  cycleViolations.some(({ code }) => code === "cycle_detected"),
  "domain dependency cycles must be rejected",
);

console.log("Foundation architecture policy tests passed (4 behavioral checks).");
