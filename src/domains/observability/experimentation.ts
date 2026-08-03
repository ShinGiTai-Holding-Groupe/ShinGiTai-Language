import type {
  ExperimentAssignment,
  ExperimentDefinition,
  ExperimentVariant,
} from "./types";

function stableHash(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function normalizedVariants(variants: readonly ExperimentVariant[]): ExperimentVariant[] {
  const keys = new Set<string>();
  for (const variant of variants) {
    if (!variant.key.trim()) throw new Error("Experiment variant key is required");
    if (keys.has(variant.key)) throw new Error(`Duplicate experiment variant key: ${variant.key}`);
    keys.add(variant.key);
    if (!Number.isFinite(variant.weight) || variant.weight < 0) {
      throw new Error(`Invalid experiment variant weight: ${variant.key}`);
    }
  }

  const valid = variants.filter((variant) => variant.weight > 0);
  const total = valid.reduce((sum, variant) => sum + variant.weight, 0);
  if (!Number.isFinite(total) || total <= 0) return [];
  return valid.map((variant) => ({ ...variant, weight: variant.weight / total }));
}

export function assignExperimentVariant(
  definition: ExperimentDefinition,
  subjectId: string,
  assignedAt: string,
): ExperimentAssignment | null {
  if (!definition.tenantPartition.trim()) throw new Error("Experiment tenantPartition is required");
  if (!subjectId.trim()) throw new Error("Experiment subjectId is required");
  if (!Number.isFinite(Date.parse(assignedAt))) throw new Error("assignedAt must be a valid timestamp");
  if (!Number.isFinite(definition.allocationPercent) || definition.allocationPercent < 0 || definition.allocationPercent > 100) {
    throw new Error("allocationPercent must be within 0..100");
  }
  if (definition.status !== "running" || definition.allocationPercent === 0) return null;

  const allocationBucket =
    stableHash(
      `${definition.tenantPartition}:${definition.salt}:${definition.experimentId}:${subjectId}:allocation`,
    ) % 10_000;
  const allocationThreshold = Math.round(definition.allocationPercent * 100);
  if (allocationBucket >= allocationThreshold) return null;

  const variants = normalizedVariants(definition.variants);
  if (variants.length === 0) return null;

  const variantBucket =
    (stableHash(
      `${definition.tenantPartition}:${definition.salt}:${definition.experimentId}:${subjectId}:variant`,
    ) %
      1_000_000) /
    1_000_000;
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (variantBucket < cumulative) {
      return {
        experimentId: definition.experimentId,
        tenantPartition: definition.tenantPartition,
        subjectId,
        variantKey: variant.key,
        assignedAt,
      };
    }
  }

  const fallback = variants[variants.length - 1];
  return {
    experimentId: definition.experimentId,
    tenantPartition: definition.tenantPartition,
    subjectId,
    variantKey: fallback.key,
    assignedAt,
  };
}
