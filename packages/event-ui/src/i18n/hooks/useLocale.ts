import { useEffect, useSyncExternalStore } from "react";

import type { Locale } from "#i18n/constants";
import { browserLanguages } from "#i18n/utils";
import { pickLocale } from "#i18n/utils";

const subscribe = (onChange: () => void) => {
  window.addEventListener("languagechange", onChange);
  return () => window.removeEventListener("languagechange", onChange);
};

const currentLocale = () => pickLocale(browserLanguages());

/** The page's language, from the browser; follows a change in the system settings. */
export function useLocale(): Locale {
  const locale = useSyncExternalStore(subscribe, currentLocale);
  useEffect(() => {
    // Screen readers and the browser's own translate offer go by <html lang>.
    document.documentElement.lang = locale;
  }, [locale]);
  return locale;
}
