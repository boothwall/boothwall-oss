import { pickLanguage } from "@boothwall/i18n";

import { type Locale, LOCALES } from "#i18n/constants";

/**
 * The first of the visitor's languages that we speak, matched on the language alone
 * ("de-AT" is "de"); English when there is none.
 */
export const pickLocale = (preferred: readonly string[]): Locale =>
  pickLanguage(preferred, LOCALES);
