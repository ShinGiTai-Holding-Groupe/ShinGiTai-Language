import { assertSameTenant, assertTenant, freezeDomain, type TenantContext } from "../shared";
import type {
  MemoryIntegrityVerifier,
  PedagogicalMemoryAuthorization,
  PedagogicalObservation,
} from "./types";

function authorize(
  capability: PedagogicalMemoryAuthorization,
  tenant: TenantContext,
  subject: string,
  scope: PedagogicalObservation["scope"],
  now: string,
  verifier: MemoryIntegrityVerifier,
): void {
  assertSameTenant(tenant, capability);
  if (
    capability.subject !== subject ||
    !capability.scopes.includes(scope) ||
    Date.parse(capability.issuedAt) > Date.parse(now) ||
    Date.parse(capability.expiresAt) <= Date.parse(now) ||
    !verifier.verify(capability)
  )
    throw new Error("Pedagogical memory authorization rejected");
}
export function recordPedagogicalObservation(
  input: Omit<PedagogicalObservation, "version" | "status"> & { readonly status?: "PROPOSED" },
  capability: PedagogicalMemoryAuthorization,
  now: string,
  verifier: MemoryIntegrityVerifier,
): PedagogicalObservation {
  assertTenant(input);
  authorize(capability, input, input.subject, input.scope, now, verifier);
  if (!input.provenance.sourceIds.length || !input.value.trim())
    throw new Error("Pedagogical memory requires structured provenance");
  return freezeDomain({ ...input, version: 1, status: "PROPOSED" as const });
}
export function validatePedagogicalObservation(
  observation: PedagogicalObservation,
  tenant: TenantContext,
): PedagogicalObservation {
  assertSameTenant(tenant, observation);
  if (observation.status !== "PROPOSED") throw new Error("Only proposed memory may be validated");
  return freezeDomain({
    ...observation,
    version: observation.version + 1,
    status: "VALIDATED" as const,
  });
}
export function projectAuthorizedPedagogicalMemory(
  observations: readonly PedagogicalObservation[],
  tenant: TenantContext,
  capability: PedagogicalMemoryAuthorization,
  now: string,
  verifier: MemoryIntegrityVerifier,
): readonly PedagogicalObservation[] {
  assertTenant(tenant);
  authorize(
    capability,
    tenant,
    capability.subject,
    capability.scopes[0] ?? "learner",
    now,
    verifier,
  );
  return freezeDomain(
    observations
      .filter((item) => {
        assertSameTenant(tenant, item);
        return (
          item.subject === capability.subject &&
          capability.scopes.includes(item.scope) &&
          item.status === "VALIDATED" &&
          (!item.expiresAt || Date.parse(item.expiresAt) > Date.parse(now))
        );
      })
      .map((item) => item),
  );
}
