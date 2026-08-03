import type { SupportedLocale } from "./types";

const BCP47_PATTERN = /^[A-Za-z]{2,3}(?:-[A-Za-z]{4})?(?:-[A-Za-z]{2}|-\d{3})?(?:-[A-Za-z0-9]{5,8})*$/;

function normalizeLocale(value: string): string {
  const normalized = value.trim().replace(/_/g, "-");
  if (!BCP47_PATTERN.test(normalized)) throw new Error(`Invalid BCP 47 locale: ${value}`);
  return normalized;
}

function parseLocale(value: string): { language: string; script?: string; region?: string } {
  const parts = normalizeLocale(value).split("-");
  const language = parts[0].toLowerCase();
  const script = parts.find((part) => /^[A-Za-z]{4}$/.test(part));
  const region = parts.find((part) => /^[A-Za-z]{2}$/.test(part) || /^\d{3}$/.test(part));
  return {
    language,
    script: script ? `${script[0].toUpperCase()}${script.slice(1).toLowerCase()}` : undefined,
    region: region?.toUpperCase(),
  };
}

export function resolveLocale(
  requestedLocale: string,
  supportedLocales: SupportedLocale[],
  defaultLocale: string,
  preferences: { preferredScriptCode?: string; preferredRegionCode?: string } = {},
): SupportedLocale {
  if (supportedLocales.length === 0) throw new Error("At least one supported locale is required");

  const requested = parseLocale(requestedLocale);
  const normalizedRequested = normalizeLocale(requestedLocale).toLowerCase();
  const exact = supportedLocales.find(
    (candidate) => normalizeLocale(candidate.locale).toLowerCase() === normalizedRequested,
  );
  if (exact) return exact;

  const candidates = supportedLocales
    .filter((candidate) => candidate.languageCode.toLowerCase() === requested.language)
    .map((candidate) => {
      let score = 0;
      const preferredScript = preferences.preferredScriptCode ?? requested.script;
      const preferredRegion = preferences.preferredRegionCode ?? requested.region;
      if (preferredScript && candidate.scriptCode?.toLowerCase() === preferredScript.toLowerCase()) score += 4;
      if (preferredRegion && candidate.regionCode?.toLowerCase() === preferredRegion.toLowerCase()) score += 2;
      if (!candidate.scriptCode) score += 0.25;
      return { candidate, score };
    })
    .sort((left, right) => right.score - left.score || left.candidate.locale.localeCompare(right.candidate.locale));
  if (candidates[0]) return candidates[0].candidate;

  const normalizedDefault = normalizeLocale(defaultLocale).toLowerCase();
  return (
    supportedLocales.find(
      (candidate) => normalizeLocale(candidate.locale).toLowerCase() === normalizedDefault,
    ) ?? supportedLocales[0]
  );
}

export function buildLocaleFallbackChain(
  locale: SupportedLocale,
  supportedLocales: SupportedLocale[],
): string[] {
  const chain = [normalizeLocale(locale.locale)];
  const seen = new Set(chain.map((item) => item.toLowerCase()));
  let current = locale;

  while (current.fallbackLocale) {
    const normalizedFallback = normalizeLocale(current.fallbackLocale);
    const key = normalizedFallback.toLowerCase();
    if (seen.has(key)) break;
    chain.push(normalizedFallback);
    seen.add(key);
    const next = supportedLocales.find(
      (item) => normalizeLocale(item.locale).toLowerCase() === key,
    );
    if (!next) break;
    current = next;
  }

  return chain;
}

export function resolveTextDirection(locale: SupportedLocale): "ltr" | "rtl" {
  return locale.direction;
}
