import type { ConflictContext, ConflictResolution } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeNoncanonicalValues<TValue>(local: TValue, server: TValue): TValue | undefined {
  if (!isRecord(local) || !isRecord(server)) return undefined;
  return { ...local, ...server } as TValue;
}

function appendValues<TValue>(local: TValue, server: TValue): TValue | undefined {
  if (!Array.isArray(local) || !Array.isArray(server)) return undefined;

  const seen = new Set<string>();
  const result: unknown[] = [];
  for (const item of [...server, ...local]) {
    const key = JSON.stringify(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result as TValue;
}

export function resolveConflict<TValue>(
  context: ConflictContext<TValue>,
): ConflictResolution<TValue> {
  const { dataClass, local, server, strategy } = context;

  if (local.tenantPartition !== server.tenantPartition) {
    return {
      status: "rejected",
      source: "manual",
      reason: "Cross-tenant conflict resolution is forbidden",
    };
  }

  if (
    dataClass === "canonical_learning" &&
    strategy !== "server_wins" &&
    strategy !== "domain_specific"
  ) {
    return {
      status: "rejected",
      source: "manual",
      reason: "Canonical learning state may only use server_wins or a domain-specific resolver",
    };
  }

  switch (strategy) {
    case "server_wins":
      return {
        status: "resolved",
        value: server.value,
        source: "server",
        reason: "Canonical server state selected; client clocks are never authoritative",
      };

    case "merge_noncanonical": {
      if (dataClass !== "noncanonical_preference" && dataClass !== "draft") {
        return {
          status: "rejected",
          source: "manual",
          reason: "Generic merge is restricted to non-canonical preferences and drafts",
        };
      }
      const merged = mergeNoncanonicalValues(local.value, server.value);
      return merged === undefined
        ? { status: "manual_required", source: "manual", reason: "Merge requires record values" }
        : {
            status: "resolved",
            value: merged,
            source: "merged",
            reason: "Non-canonical values merged with server fields taking precedence",
          };
    }

    case "append_only": {
      if (dataClass !== "append_only_history") {
        return {
          status: "rejected",
          source: "manual",
          reason: "Append-only resolver is restricted to append-only history",
        };
      }
      const appended = appendValues(local.value, server.value);
      return appended === undefined
        ? {
            status: "manual_required",
            source: "manual",
            reason: "Append-only strategy requires array values",
          }
        : {
            status: "resolved",
            value: appended,
            source: "appended",
            reason: "Append-only histories combined without allocating server revision locally",
          };
    }

    case "manual_resolution":
    case "domain_specific":
      return {
        status: "manual_required",
        source: "manual",
        reason: `${strategy} requires a server-side domain resolver`,
      };
  }
}

export function recommendedConflictStrategy(entityType: string): ConflictContext["strategy"] {
  if (/^(attempt|review_event|learning_event|usage_ledger)$/.test(entityType)) return "append_only";
  if (/^(note|draft|preference|settings)$/.test(entityType)) return "merge_noncanonical";
  if (/^(mastery|entitlement|certification|billing)$/.test(entityType)) return "server_wins";
  if (/^(lesson_progress|srs_state)$/.test(entityType)) return "domain_specific";
  return "manual_resolution";
}
