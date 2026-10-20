import { LOCALE_PARAM } from "#i18n/constants";

/** The visitor's languages, best first: `?lang=` if given, then the browser's list. */
export function browserLanguages(): string[] {
  const chosen = new URLSearchParams(window.location.search).get(LOCALE_PARAM);
  const browser = navigator.languages?.length ? navigator.languages : [navigator.language];
  return chosen ? [chosen, ...browser] : [...browser];
}
