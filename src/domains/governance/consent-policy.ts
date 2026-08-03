import type {
  ConsentRecord,
  ConsentRequirement,
  ConsentSubjectType,
  ProcessingDecision,
} from "./types";

function isActive(record: ConsentRecord): boolean {
  return record.withdrawnAt === undefined;
}

function parseVersion(value: string): number[] | null {
  const normalized = value.trim().replace(/^v/i, "");
  if (!/^\d+(?:\.\d+)*$/.test(normalized)) return null;
  return normalized.split(".").map(Number);
}

function versionSatisfies(actual: string, minimum?: string): boolean {
  if (!minimum) return true;
  const actualParts = parseVersion(actual);
  const minimumParts = parseVersion(minimum);
  if (!actualParts || !minimumParts) return false;
  const length = Math.max(actualParts.length, minimumParts.length);
  for (let index = 0; index < length; index += 1) {
    const left = actualParts[index] ?? 0;
    const right = minimumParts[index] ?? 0;
    if (left > right) return true;
    if (left < right) return false;
  }
  return true;
}

function scopeSatisfies(actual: string, acceptedScopes?: readonly string[]): boolean {
  if (!acceptedScopes || acceptedScopes.length === 0) return true;
  return acceptedScopes.includes(actual);
}

export function evaluateConsentRequirements(
  records: ConsentRecord[],
  requirements: ConsentRequirement[],
  context: {
    tenantPartition: string;
    subjectType: ConsentSubjectType;
    subjectId: string;
  },
): ProcessingDecision {
  if (!context.tenantPartition.trim() || !context.subjectId.trim()) {
    return { allowed: false, reason: "subject_mismatch", missing: requirements };
  }

  const tenantRecords = records.filter((record) => record.tenantPartition === context.tenantPartition);
  if (records.length > 0 && tenantRecords.length === 0) {
    return { allowed: false, reason: "tenant_mismatch", missing: requirements };
  }

  const subjectRecords = tenantRecords.filter(
    (record) => record.subjectType === context.subjectType && record.subjectId === context.subjectId,
  );
  if (tenantRecords.length > 0 && subjectRecords.length === 0) {
    return { allowed: false, reason: "subject_mismatch", missing: requirements };
  }

  const missing: ConsentRequirement[] = [];
  let sawWithdrawn = false;
  let sawOutdated = false;
  let sawScopeMismatch = false;

  for (const requirement of requirements) {
    const candidates = subjectRecords.filter(
      (record) => record.consentType === requirement.consentType,
    );
    const active = candidates.filter(isActive);
    if (active.length === 0) {
      if (candidates.some((record) => record.withdrawnAt !== undefined)) sawWithdrawn = true;
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

    if (!versionMatches.some((record) => scopeSatisfies(record.scope, requirement.acceptedScopes))) {
      sawScopeMismatch = true;
      missing.push(requirement);
    }
  }

  if (missing.length === 0) return { allowed: true, reason: "consent_satisfied" };
  if (sawWithdrawn) return { allowed: false, reason: "consent_withdrawn", missing };
  if (sawOutdated) return { allowed: false, reason: "version_outdated", missing };
  if (sawScopeMismatch) return { allowed: false, reason: "scope_mismatch", missing };
  return { allowed: false, reason: "consent_missing", missing };
}

export function withdrawConsent(record: ConsentRecord, withdrawnAt: string): ConsentRecord {
  if (record.withdrawnAt) return record;
  const parsed = Date.parse(withdrawnAt);
  if (!Number.isFinite(parsed) || parsed < Date.parse(record.grantedAt)) {
    throw new Error("withdrawnAt must be a valid timestamp after grantedAt");
  }
  return { ...record, withdrawnAt };
}
