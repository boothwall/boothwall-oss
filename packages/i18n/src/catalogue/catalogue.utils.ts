import { type I18n, type Messages, setupI18n } from "@lingui/core";

import type { Language } from "#languages";

export type { I18n, Messages } from "@lingui/core";

/** One area's compiled messages per language, loaded on demand (a lazy chunk on the web). */
export type CatalogueLoaders = Readonly<
  Record<string, Partial<Record<Language, () => Promise<{ messages: Messages }>>>>
>;

/** A Lingui instance per app (never Lingui's global), so packages and tests can't leak languages. */
export const createI18n = (): I18n => setupI18n();

/**
 * Loads the areas a surface shows in one language and switches to it. English loads too when the
 * language misses an area, so a surface never shows bare message ids.
 */
export async function activateLanguage(
  i18n: I18n,
  language: Language,
  loaders: CatalogueLoaders,
  areas: readonly string[] = Object.keys(loaders),
): Promise<void> {
  const parts = await Promise.all(
    areas.map(async (area) => {
      const load = loaders[area]?.[language] ?? loaders[area]?.en;
      if (!load) throw new Error(`No catalogue for area "${area}"`);
      return (await load()).messages;
    }),
  );
  i18n.loadAndActivate({ locale: language, messages: Object.assign({}, ...parts) as Messages });
}

/**
 * A typed `t`: an unknown id or a missing value fails `tsc`. `Values` is the generated
 * `MessageValues` of the package that owns the messages.
 */
export function createTranslator<Values extends Record<string, object>>(i18n: I18n) {
  return <Id extends keyof Values & string>(
    id: Id,
    ...values: keyof Values[Id] extends never ? [] : [Values[Id]]
  ): string => i18n._(id, values[0] as Record<string, unknown> | undefined);
}
