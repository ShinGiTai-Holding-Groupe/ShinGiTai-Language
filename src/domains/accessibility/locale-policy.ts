import type { SupportedLocale } from "./types";

function normalizeLocale(value: string): string {
  return value.trim().replace(/_/g, "-");
}

export function resolveLocale(
  requestedLocale: string,
  supportedLocales: SupportedLocale[],
  defaultLocale: string,
): SupportedLocale {
  if (supportedLocales.length === 0) {
    throw new Error("At least one supported locale is required");
  }

  const normalizedRequested = normalizeLocale(requestedLocale).toLowerCase();
  const exact = supportedLocales.find(
    (candidate) => normalizeLocale(candidate.locale).toLowerCase() === normalizedRequested,
  );
  if (exact) return exact;

  const requestedLanguage = normalizedRequested.split("-")[0];
  const languageMatch = supportedLocales.find(
    (candidate) => candidate.languageCode.toLowerCase() === requestedLanguage,
  );
  if (languageMatch) return languageMatch;

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
  const chain = [locale.locale];
  const seen = new Set(chain.map((item) => item.toLowerCase()));
  let current = locale;

  while (current.fallbackLocale) {
    const key = current.fallbackLocale.toLowerCase();
    if (seen.has(key)) break;
    chain.push(current.fallbackLocale);
    seen.add(key);
    const next = supportedLocales.find((item) => item.locale.toLowerCase() === key);
    if (!next) break;
    current = next;
  }

  return chain;
}

export function resolveTextDirection(locale: SupportedLocale): "ltr" | "rtl" {
  return locale.direction;
}
