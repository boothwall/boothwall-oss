import type { Language } from "@boothwall/i18n";

/** Languages the guest-facing pages speak; the first is the fallback. */
export const LOCALES = ["en", "de"] as const satisfies readonly Language[];

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** `?lang=de` picks a language by hand, ahead of the browser's. */
export const LOCALE_PARAM = "lang";
