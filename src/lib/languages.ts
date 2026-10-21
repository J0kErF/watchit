/** ISO 639-1 (plus a few regional) codes offered in the subtitle picker. Any valid BCP-47 code is accepted by the API. */
export const LANGUAGE_CODES = [
  "af", "am", "ar", "az", "be", "bg", "bn", "bs", "ca", "cs", "cy", "da", "de", "el", "en", "es", "et", "eu",
  "fa", "fi", "fil", "fr", "ga", "gl", "gu", "ha", "he", "hi", "hr", "hu", "hy", "id", "ig", "is", "it", "ja",
  "jv", "ka", "kk", "km", "kn", "ko", "ku", "ky", "lo", "lt", "lv", "mk", "ml", "mn", "mr", "ms", "mt", "my",
  "ne", "nl", "no", "pa", "pl", "ps", "pt", "pt-BR", "ro", "ru", "si", "sk", "sl", "so", "sq", "sr", "sv", "sw",
  "ta", "te", "tg", "th", "tk", "tr", "uk", "ur", "uz", "vi", "xh", "yo", "zh", "zh-TW", "zu",
];

export const QUICK_LANGUAGES = ["en", "es", "ar", "fr", "he", "de", "pt-BR", "ru", "zh", "hi", "ja", "tr"];

/** Subtitles in the spoken language, without translation. */
export const ORIGINAL = "original";

/** Returns the canonical code for a real language, or null. */
export function normalizeLanguage(code: string): string | null {
  if (code === ORIGINAL) return ORIGINAL;
  try {
    const [canonical] = Intl.getCanonicalLocales(code);
    if (!canonical) return null;
    const name = new Intl.DisplayNames(["en"], { type: "language", fallback: "none" }).of(canonical);
    return name ? canonical : null;
  } catch {
    return null;
  }
}

export function languageName(code: string, locale = "en"): string {
  if (code === ORIGINAL) return "Original language";
  try {
    return new Intl.DisplayNames([locale, "en"], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
}
