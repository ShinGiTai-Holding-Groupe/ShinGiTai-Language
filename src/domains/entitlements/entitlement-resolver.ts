import type {
  EntitlementGrant,
  EntitlementResolution,
  EntitlementResolutionInput,
} from "./types";

const SOURCE_WEIGHT: Record<EntitlementGrant["source"], number> = {
  restriction: 1_000,
  admin_grant: 900,
  direct_grant: 800,
  organization: 700,
  promotion: 600,
  trial: 500,
  plan: 400,
};

function parseOptionalTimestamp(value: string | undefined, field: string): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be a valid timestamp.`);
  return parsed;
}

function validateGrant(grant: EntitlementGrant): void {
  if (!grant.tenantPartition.trim()) throw new Error("tenantPartition is required.");
  if (grant.usageLimit !== undefined && (!Number.isFinite(grant.usageLimit) || grant.usageLimit < 0)) {
    throw new Error("usageLimit must be a finite non-negative number.");
  }
  const validFrom = parseOptionalTimestamp(grant.validFrom, "validFrom");
  const validUntil = parseOptionalTimestamp(grant.validUntil, "validUntil");
  const graceUntil = parseOptionalTimestamp(grant.graceUntil, "graceUntil");
  if (validFrom !== undefined && validUntil !== undefined && validUntil < validFrom) {
    throw new Error("validUntil cannot precede validFrom.");
  }
  if (graceUntil !== undefined && validUntil === undefined) {
    throw new Error("graceUntil requires validUntil.");
  }
  if (graceUntil !== undefined && validUntil !== undefined && graceUntil < validUntil) {
    throw new Error("graceUntil cannot precede validUntil.");
  }
}

function rank(grant: EntitlementGrant): number {
  return SOURCE_WEIGHT[grant.source] * 1_000 + Math.max(-999, Math.min(999, grant.priority ?? 0));
}

function chooseGrant(grants: EntitlementGrant[]): EntitlementGrant | undefined {
  return [...grants].sort((left, right) => {
    const rankDelta = rank(right) - rank(left);
    if (rankDelta !== 0) return rankDelta;
    const leftUntil = parseOptionalTimestamp(left.validUntil, "validUntil") ?? Number.POSITIVE_INFINITY;
    const rightUntil = parseOptionalTimestamp(right.validUntil, "validUntil") ?? Number.POSITIVE_INFINITY;
    return rightUntil - leftUntil;
  })[0];
}

export function resolveEntitlement(input: EntitlementResolutionInput): EntitlementResolution {
  const now = Date.parse(input.now);
  if (!Number.isFinite(now)) throw new Error("Entitlement resolution requires a valid timestamp.");
  if (!input.tenantPartition.trim()) throw new Error("tenantPartition is required.");

  for (const grant of input.grants) validateGrant(grant);

  const candidates = input.grants.filter((grant) => {
    if (
      grant.tenantPartition !== input.tenantPartition ||
      grant.subjectId !== input.subjectId ||
      grant.subjectType !== input.subjectType ||
      grant.featureKey !== input.featureKey
    ) {
      return false;
    }
    if (grant.status !== "active") return false;
    const validFrom = parseOptionalTimestamp(grant.validFrom, "validFrom");
    return validFrom === undefined || validFrom <= now;
  });

  const active = candidates.filter((grant) => {
    const validUntil = parseOptionalTimestamp(grant.validUntil, "validUntil");
    return validUntil === undefined || validUntil >= now;
  });

  const activeRestrictions = active.filter(
    (grant) => grant.source === "restriction" || grant.accessLevel === "denied",
  );
  const selectedRestriction = chooseGrant(activeRestrictions);
  if (selectedRestriction) {
    return {
      allowed: false,
      accessLevel: "denied",
      validUntil: selectedRestriction.validUntil,
      source: selectedRestriction.source,
      entitlementId: selectedRestriction.entitlementId,
      reason: "active_restriction",
    };
  }

  const selectedActive = chooseGrant(active);
  if (selectedActive) {
    return {
      allowed: true,
      accessLevel: selectedActive.accessLevel,
      usageLimit: selectedActive.usageLimit,
      validUntil: selectedActive.validUntil,
      source: selectedActive.source,
      entitlementId: selectedActive.entitlementId,
      reason: "active_grant",
    };
  }

  const graceCandidates = candidates.filter((grant) => {
    if (grant.source === "restriction" || grant.accessLevel === "denied") return false;
    const validUntil = parseOptionalTimestamp(grant.validUntil, "validUntil");
    const graceUntil = parseOptionalTimestamp(grant.graceUntil, "graceUntil");
    return validUntil !== undefined && validUntil < now && graceUntil !== undefined && graceUntil >= now;
  });

  const selectedGrace = chooseGrant(graceCandidates);
  if (selectedGrace) {
    return {
      allowed: true,
      accessLevel: "grace_period",
      usageLimit: selectedGrace.usageLimit,
      validUntil: selectedGrace.graceUntil,
      source: selectedGrace.source,
      entitlementId: selectedGrace.entitlementId,
      reason: "within_grace_period",
    };
  }

  const expired = chooseGrant(candidates);
  return expired
    ? {
        allowed: false,
        accessLevel: "expired",
        validUntil: expired.validUntil,
        source: expired.source,
        entitlementId: expired.entitlementId,
        reason: "grant_expired",
      }
    : { allowed: false, accessLevel: "denied", reason: "no_matching_grant" };
}
