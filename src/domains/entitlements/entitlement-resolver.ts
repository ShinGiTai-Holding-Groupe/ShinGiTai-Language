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

function toEpoch(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isStarted(grant: EntitlementGrant, now: number): boolean {
  const validFrom = toEpoch(grant.validFrom);
  return validFrom === undefined || validFrom <= now;
}

function rank(grant: EntitlementGrant): number {
  return (grant.priority ?? 0) * 10_000 + SOURCE_WEIGHT[grant.source];
}

function chooseGrant(grants: EntitlementGrant[]): EntitlementGrant | undefined {
  return [...grants].sort((left, right) => {
    const rankDelta = rank(right) - rank(left);
    if (rankDelta !== 0) return rankDelta;

    const leftUntil = toEpoch(left.validUntil) ?? Number.POSITIVE_INFINITY;
    const rightUntil = toEpoch(right.validUntil) ?? Number.POSITIVE_INFINITY;
    return rightUntil - leftUntil;
  })[0];
}

export function resolveEntitlement(input: EntitlementResolutionInput): EntitlementResolution {
  const now = Date.parse(input.now);
  if (!Number.isFinite(now)) {
    throw new Error("Entitlement resolution requires a valid ISO timestamp.");
  }

  const candidates = input.grants.filter(
    (grant) =>
      grant.subjectId === input.subjectId &&
      grant.featureKey === input.featureKey &&
      grant.status !== "revoked" &&
      grant.status !== "inactive" &&
      isStarted(grant, now),
  );

  const active = candidates.filter((grant) => {
    const validUntil = toEpoch(grant.validUntil);
    return validUntil === undefined || validUntil >= now;
  });

  const selectedActive = chooseGrant(active);
  if (selectedActive) {
    const denied = selectedActive.source === "restriction" || selectedActive.accessLevel === "denied";
    return {
      allowed: !denied,
      accessLevel: denied ? "denied" : selectedActive.accessLevel,
      usageLimit: denied ? undefined : selectedActive.usageLimit,
      validUntil: selectedActive.validUntil,
      source: selectedActive.source,
      entitlementId: selectedActive.entitlementId,
      reason: denied ? "active_restriction" : "active_grant",
    };
  }

  const graceCandidates = candidates.filter((grant) => {
    const validUntil = toEpoch(grant.validUntil);
    const graceUntil = toEpoch(grant.graceUntil);
    return validUntil !== undefined && validUntil < now && graceUntil !== undefined && graceUntil >= now;
  });

  const selectedGrace = chooseGrant(graceCandidates);
  if (selectedGrace && selectedGrace.source !== "restriction" && selectedGrace.accessLevel !== "denied") {
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
  if (expired) {
    return {
      allowed: false,
      accessLevel: "expired",
      validUntil: expired.validUntil,
      source: expired.source,
      entitlementId: expired.entitlementId,
      reason: "grant_expired",
    };
  }

  return {
    allowed: false,
    accessLevel: "denied",
    reason: "no_matching_grant",
  };
}
