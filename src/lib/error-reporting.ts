export function reportClientError(error: unknown, context: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  console.error("[ShinGiTai Language] Client error", {
    name: error instanceof Error ? error.name : "UnknownError",
    route: window.location.pathname,
    ...context,
  });
}
