export type ExtensionCapability =
  | "lesson_renderer"
  | "exercise_type"
  | "assessment_strategy"
  | "notification_channel"
  | "analytics_sink"
  | "content_importer";

export interface ExtensionManifest {
  readonly extensionId: string;
  readonly version: string;
  readonly apiVersion: string;
  readonly capabilities: readonly ExtensionCapability[];
  readonly trusted: boolean;
  readonly enabled: boolean;
  readonly configurationSchemaVersion?: string;
}

export interface ExtensionRegistration<T> {
  readonly manifest: ExtensionManifest;
  readonly implementation: T;
}

export interface ExtensionRegistry<T = unknown> {
  readonly registrations: ReadonlyMap<string, ExtensionRegistration<T>>;
}

export interface ExtensionValidationResult {
  readonly accepted: boolean;
  readonly reason?:
    | "disabled"
    | "untrusted"
    | "api_version_mismatch"
    | "duplicate_extension"
    | "capability_not_declared";
}

export function registerExtension<T>(
  registry: ExtensionRegistry<T>,
  registration: ExtensionRegistration<T>,
  requiredApiVersion: string,
  requiredCapability: ExtensionCapability,
): {
  readonly registry: ExtensionRegistry<T>;
  readonly result: ExtensionValidationResult;
} {
  const { manifest } = registration;

  if (!manifest.enabled) return { registry, result: { accepted: false, reason: "disabled" } };
  if (!manifest.trusted) return { registry, result: { accepted: false, reason: "untrusted" } };
  if (manifest.apiVersion !== requiredApiVersion) {
    return { registry, result: { accepted: false, reason: "api_version_mismatch" } };
  }
  if (!manifest.capabilities.includes(requiredCapability)) {
    return { registry, result: { accepted: false, reason: "capability_not_declared" } };
  }
  if (registry.registrations.has(manifest.extensionId)) {
    return { registry, result: { accepted: false, reason: "duplicate_extension" } };
  }

  const registrations = new Map(registry.registrations);
  registrations.set(manifest.extensionId, registration);
  return {
    registry: { registrations },
    result: { accepted: true },
  };
}

export function unregisterExtension<T>(
  registry: ExtensionRegistry<T>,
  extensionId: string,
): ExtensionRegistry<T> {
  if (!registry.registrations.has(extensionId)) return registry;
  const registrations = new Map(registry.registrations);
  registrations.delete(extensionId);
  return { registrations };
}

export function getExtensionsByCapability<T>(
  registry: ExtensionRegistry<T>,
  capability: ExtensionCapability,
): readonly ExtensionRegistration<T>[] {
  return [...registry.registrations.values()]
    .filter(({ manifest }) => manifest.enabled && manifest.capabilities.includes(capability))
    .sort((left, right) => left.manifest.extensionId.localeCompare(right.manifest.extensionId));
}
