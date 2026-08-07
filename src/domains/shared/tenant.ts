export interface TenantContext {
  readonly tenantPartition: string;
  readonly userId: string;
  readonly organizationId?: string;
}

export class TenantBoundaryError extends Error {
  readonly code = "tenant_boundary_violation";
  constructor(message: string) {
    super(message);
    this.name = "TenantBoundaryError";
  }
}

export function assertTenant(context: TenantContext): void {
  if (!context.tenantPartition.trim() || !context.userId.trim())
    throw new TenantBoundaryError("Tenant partition and user are required");
}

export function sameTenant(left: TenantContext, right: TenantContext): boolean {
  return (
    left.tenantPartition === right.tenantPartition &&
    left.userId === right.userId &&
    left.organizationId === right.organizationId
  );
}

export function assertSameTenant(expected: TenantContext, actual: TenantContext): void {
  assertTenant(expected);
  assertTenant(actual);
  if (!sameTenant(expected, actual)) throw new TenantBoundaryError("Cross-tenant access rejected");
}

export function assertValidDate(value: string, field: string): void {
  if (!value.trim() || !Number.isFinite(Date.parse(value))) throw new Error(`${field} is invalid`);
}

export function freezeDomain<T extends object>(value: T): Readonly<T> {
  for (const item of Object.values(value))
    if (item && typeof item === "object") freezeDomain(item as object);
  return Object.freeze(value);
}
