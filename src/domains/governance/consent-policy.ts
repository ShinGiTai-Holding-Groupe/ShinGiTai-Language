import type {
  ConsentRecord,
  ConsentRequirement,
  ProcessingDecision,
} from "./types";

function isActive(record: ConsentRecord): boolean {
  return record.withdrawnAt === undefined;
}

function versionSatisfies(actual: string, minimum?: string): boolean {
  if (!minimum) return true;
  return actual === minimum;
}

function scopeSatisfies(actual: string, required?: string): boolean {
  if (!required) return true;
  return actual === required || actual === "global";
}

export function evaluateConsentRequirements(
  records: ConsentRecord[],
  requirements: ConsentRequirement[],
): ProcessingDecision {
  const missing: ConsentRequirement[] = [];
  let sawWithdrawn = false;
  let sawOutdated = false;
  let sawScopeMismatch = false;

  for (const requirement of requirements) {
    const candidates = records.filter(
      (record) => record.consentType === requirement.consentType,
    );

    const active = candidates.filter(isActive);

    if (active.length === 0) {
      if (candidates.some((record) => record.withdrawnAt !== undefined)) {
        sawWithdrawn = true;
      }
      missing.push(requirement);
      continue;
    }

    const versionMatches = active.filter((record) =>
      versionSatisfies(record.version, requirement.minimumVersion),
    );

    if (versionMatches.length === 0) {
      sawOutdated = true;
      missing.push(requirement);
      continue;
    }

    const scopeMatches = versionMatches.some((record) =>
      scopeSatisfies(record.scope, requirement.scope),
    );

    if (!scopeMatches) {
      sawScopeMismatch = true;
      missing.push(requirement);
    }
  }

  if (missing.length === 0) {
    return { allowed: true, reason: "consent_satisfied" };
  }

  if (sawWithdrawn) {
    return { allowed: false, reason: "consent_withdrawn", missing };
  }

  if (sawOutdated) {
    return { allowed: false, reason: "version_outdated", missing };
  }

  if (sawScopeMismatch) {
    return { allowed: false, reason: "scope_mismatch", missing };
  }

  return { allowed: false, reason: "consent_missing", missing };
}

export function withdrawConsent(
  record: ConsentRecord,
  withdrawnAt: string,
): ConsentRecord {
  if (record.withdrawnAt) return record;
  return { ...record, withdrawnAt };
}
