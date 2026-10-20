import type { Language } from "#languages";

import { baseLanguage } from "./pick-language.utils.ts";

/**
 * The locale numbers and dates are written in: the UI language, refined by the device's region
 * only when the device's first language is that same language ("de" + "de-AT" → "de-AT"). A
 * region never picks the language.
 */
export function formatLocale(language: Language, deviceLanguages: readonly string[]): string {
  const first = deviceLanguages[0]?.trim().replace("_", "-");
  if (!first || baseLanguage(first) !== language) return language;
  try {
    return Intl.NumberFormat.supportedLocalesOf([first])[0] ?? language;
  } catch {
    return language;
  }
}
