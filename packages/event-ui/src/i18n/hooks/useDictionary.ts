import type { Locale } from "#i18n/constants";
import { useLocale } from "#i18n/hooks";

/** Every language's copy for one feature, all with the same shape. */
export type Dictionary<Copy> = Readonly<Record<Locale, Copy>>;

/** The copy in the visitor's language. */
export function useDictionary<Copy>(dictionary: Dictionary<Copy>): Copy {
  return dictionary[useLocale()];
}
