import type { CefrLevel, SupportedLanguageCode } from "./content-model";

export interface LanguageCatalogEntry {
  readonly code: SupportedLanguageCode;
  readonly name: string;
  readonly nativeName: string;
  readonly flag: string;
  readonly writingSystems: readonly string[];
  readonly availableLevels: readonly CefrLevel[];
  readonly defaultLevel: CefrLevel;
}

const ALL_LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"] as const;

export const LANGUAGE_CATALOG: readonly LanguageCatalogEntry[] = [
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", writingSystems: ["hiragana", "katakana", "kanji"], availableLevels: ALL_LEVELS, defaultLevel: "A0" },
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧", writingSystems: ["latin"], availableLevels: ALL_LEVELS, defaultLevel: "A0" },
  { code: "no", name: "Norwegian", nativeName: "Norsk", flag: "🇳🇴", writingSystems: ["latin"], availableLevels: ALL_LEVELS, defaultLevel: "A0" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱", writingSystems: ["latin"], availableLevels: ALL_LEVELS, defaultLevel: "A0" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳", writingSystems: ["hanzi", "pinyin"], availableLevels: ALL_LEVELS, defaultLevel: "A0" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷", writingSystems: ["hangul", "hanja"], availableLevels: ALL_LEVELS, defaultLevel: "A0" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", writingSystems: ["latin"], availableLevels: ALL_LEVELS, defaultLevel: "A0" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", writingSystems: ["latin"], availableLevels: ALL_LEVELS, defaultLevel: "A0" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", writingSystems: ["latin"], availableLevels: ALL_LEVELS, defaultLevel: "A0" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹", writingSystems: ["latin"], availableLevels: ALL_LEVELS, defaultLevel: "A0" },
] as const;

export function getLanguageCatalogEntry(code: string): LanguageCatalogEntry | undefined {
  return LANGUAGE_CATALOG.find((language) => language.code === code);
}

export function getNextLevel(level: CefrLevel): CefrLevel | null {
  const index = ALL_LEVELS.indexOf(level);
  return index >= 0 && index < ALL_LEVELS.length - 1 ? ALL_LEVELS[index + 1] : null;
}
