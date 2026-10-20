import type { I18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { type ReactNode, useMemo } from "react";

import { createFormatters } from "#format";
import type { Language } from "#languages";

import { RegionalContext } from "../context/regional.context.ts";

type Props = {
  i18n: I18n;
  /** Already resolved and activated on `i18n` (see `activateLanguage`). */
  language: Language;
  /** From `formatLocale`. */
  locale: string;
  timeZone: string;
  children: ReactNode;
};

/** The one place a React app's language lives; a switch re-renders the tree once. */
export function LanguageProvider({ i18n, language, locale, timeZone, children }: Props) {
  const value = useMemo(
    () => ({ language, formatters: createFormatters({ locale, timeZone }) }),
    [language, locale, timeZone],
  );
  return (
    <I18nProvider i18n={i18n}>
      <RegionalContext.Provider value={value}>{children}</RegionalContext.Provider>
    </I18nProvider>
  );
}
