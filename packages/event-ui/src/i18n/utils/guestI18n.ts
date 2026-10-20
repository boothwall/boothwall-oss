import { createI18n, type I18n, type Messages } from "@boothwall/i18n";
import { messages as captureDe } from "@boothwall/i18n/messages/de/capture";
import { messages as captureEn } from "@boothwall/i18n/messages/en/capture";

import type { Locale } from "#i18n/constants";

// Guest pages pick their language before the first paint, so their catalogues are bundled
// (both languages together are a few kilobytes). Lazy loading comes with more languages.
const CATALOGUES: Readonly<Record<Locale, Messages>> = { en: captureEn, de: captureDe };

const instances = new Map<Locale, I18n>();

/** The guest pages' messages in one language; one instance per language, shared by every page. */
export function guestI18n(locale: Locale): I18n {
  let i18n = instances.get(locale);
  if (!i18n) {
    i18n = createI18n();
    i18n.loadAndActivate({ locale, messages: CATALOGUES[locale] });
    instances.set(locale, i18n);
  }
  return i18n;
}
