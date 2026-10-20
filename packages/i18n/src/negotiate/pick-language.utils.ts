import { DEFAULT_LANGUAGE, type Language, LANGUAGES } from "#languages";

/** "de-AT", "DE_at" and "de" all mean "de"; anything unreadable means nothing. */
export function baseLanguage(tag: string): string {
  return tag.trim().toLowerCase().split(/[-_]/)[0] ?? "";
}

/**
 * The first candidate a surface speaks, matched on the language alone. Candidates come best
 * first (an explicit choice, then a saved preference, then the device); empty ones are skipped. With
 * no match: English when the surface has it, otherwise the surface's first language.
 */
export function pickLanguage<L extends Language = Language>(
  candidates: readonly (string | null | undefined)[],
  supported: readonly L[] = LANGUAGES as readonly Language[] as readonly L[],
): L {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const language = supported.find((option) => option === baseLanguage(candidate));
    if (language) return language;
  }
  const fallback = supported.find((option) => option === DEFAULT_LANGUAGE);
  return fallback ?? supported[0] ?? (DEFAULT_LANGUAGE as L);
}
