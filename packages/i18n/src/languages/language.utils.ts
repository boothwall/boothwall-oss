import { type Language, LANGUAGES } from "./languages.constants.ts";

/**
 * Use wherever a language crosses a boundary (storage, URL, API) so a bad tag never reaches
 * `Intl`. Schemas build their own enum from `LANGUAGES` (`z.enum(LANGUAGES)`).
 */
export const isLanguage = (value: unknown): value is Language =>
  typeof value === "string" && (LANGUAGES as readonly string[]).includes(value);

/** The language a stored or sent value names, or `null`. */
export const parseLanguage = (value: unknown): Language | null =>
  isLanguage(value) ? value : null;
