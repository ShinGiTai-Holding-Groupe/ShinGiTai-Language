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
  const valid = variants.filter((variant) => variant.weight > 0);
  const total = valid.reduce((sum, variant) => sum + variant.weight, 0);

  if (total <= 0) return [];

  return valid.map((variant) => ({
    ...variant,
    weight: variant.weight / total,
  }));
}

export function assignExperimentVariant(
  definition: ExperimentDefinition,
  subjectId: string,
  assignedAt: string,
): ExperimentAssignment | null {
  if (definition.status !== "running" || definition.allocationPercent <= 0) return null;

  const allocationBucket = stableHash(`${definition.salt}:${definition.experimentId}:${subjectId}:allocation`) % 10_000;
  const allocationThreshold = Math.round(Math.min(100, definition.allocationPercent) * 100);

  if (allocationBucket >= allocationThreshold) return null;

  const variants = normalizedVariants(definition.variants);
  if (variants.length === 0) return null;

  const variantBucket = (stableHash(`${definition.salt}:${definition.experimentId}:${subjectId}:variant`) % 1_000_000) / 1_000_000;
  let cumulative = 0;

  for (const variant of variants) {
    cumulative += variant.weight;
    if (variantBucket < cumulative) {
      return {
        experimentId: definition.experimentId,
        subjectId,
        variantKey: variant.key,
        assignedAt,
      };
    }
  }

  const fallback = variants[variants.length - 1];
  return {
    experimentId: definition.experimentId,
    subjectId,
    variantKey: fallback.key,
    assignedAt,
  };
}
