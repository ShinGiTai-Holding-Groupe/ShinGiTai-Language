import type { ConflictContext, ConflictResolution } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeValues<TValue>(local: TValue, server: TValue): TValue {
  if (isRecord(local) && isRecord(server)) {
    return { ...server, ...local } as TValue;
  }

  return local;
}

function appendValues<TValue>(local: TValue, server: TValue): TValue | undefined {
  if (!Array.isArray(local) || !Array.isArray(server)) {
    return undefined;
  }

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

export function resolveConflict<TValue>(context: ConflictContext<TValue>): ConflictResolution<TValue> {
  const { local, server, strategy } = context;
  const nextServerRevision = server.serverRevision + 1;

  switch (strategy) {
    case "server_wins":
      return {
        status: "resolved",
        value: server.value,
        source: "server",
        nextServerRevision: server.serverRevision,
        reason: "Canonical server state selected",
      };

    case "client_wins":
      return {
        status: "resolved",
        value: local.value,
        source: "local",
        nextServerRevision,
        reason: "Explicit client-wins policy selected local state",
      };

    case "last_write_wins": {
      const localTime = new Date(local.updatedAt).getTime();
      const serverTime = new Date(server.updatedAt).getTime();
      const useLocal = Number.isFinite(localTime) && localTime > serverTime;

      return {
        status: "resolved",
        value: useLocal ? local.value : server.value,
        source: useLocal ? "local" : "server",
        nextServerRevision: useLocal ? nextServerRevision : server.serverRevision,
        reason: useLocal ? "Local update is newer" : "Server update is newer or timestamps are equal",
      };
    }

    case "merge":
      return {
        status: "resolved",
        value: mergeValues(local.value, server.value),
        source: "merged",
        nextServerRevision,
        reason: "Record values merged with local fields taking precedence",
      };

    case "append_only": {
      const appended = appendValues(local.value, server.value);

      if (appended === undefined) {
        return {
          status: "manual_required",
          source: "manual",
          reason: "Append-only strategy requires array values",
        };
      }

      return {
        status: "resolved",
        value: appended,
        source: "appended",
        nextServerRevision,
        reason: "Append-only histories combined and exact duplicates removed",
      };
    }

    case "manual_resolution":
    case "domain_specific":
      return {
        status: "manual_required",
        source: "manual",
        reason: `${strategy} requires a domain resolver`,
      };
  }
}

export function recommendedConflictStrategy(entityType: string): ConflictContext["strategy"] {
  if (/^(attempt|review_event|learning_event|usage_ledger)$/.test(entityType)) return "append_only";
  if (/^(note|draft|preference|settings)$/.test(entityType)) return "merge";
  if (/^(mastery|entitlement|certification|billing)$/.test(entityType)) return "server_wins";
  if (/^(lesson_progress|srs_state)$/.test(entityType)) return "domain_specific";
  return "manual_resolution";
}
