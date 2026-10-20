import { type Language, LANGUAGE_INFO, parseLanguage } from "#languages";
import type { DeviceLocale, PreferenceStore } from "#ports";

/** `?lang=de` picks a language by hand, ahead of everything the device says. */
export const LANGUAGE_PARAM = "lang";

/** The language the page's URL asks for, if any (unvalidated; `pickLanguage` validates). */
export const urlLanguage = (search = window.location.search) =>
  new URLSearchParams(search).get(LANGUAGE_PARAM);

export const browserLocale: DeviceLocale = {
  languages: () => (navigator.languages?.length ? navigator.languages : [navigator.language]),
  timeZone: () => Intl.DateTimeFormat().resolvedOptions().timeZone,
};

/** A remembered choice in `localStorage`. A bad or foreign value reads as "automatic". */
export function storedPreference(
  key: string,
  storage: Storage = window.localStorage,
): PreferenceStore {
  return {
    read() {
      try {
        return parseLanguage(storage.getItem(key));
      } catch {
        return null;
      }
    },
    write(language) {
      try {
        if (language) storage.setItem(key, language);
        else storage.removeItem(key);
      } catch {
        // Private mode or a full quota: the choice lasts for this page only.
      }
    },
  };
}

/** Screen readers, hyphenation and the browser's translate offer all go by `<html lang dir>`. */
export function setDocumentLanguage(language: Language, root = document.documentElement) {
  root.lang = language;
  root.dir = LANGUAGE_INFO[language].dir;
}
