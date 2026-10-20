// Building an Intl formatter is far slower than using one, so each (locale, options) pair is
// built once and reused.
const cache = new Map<string, unknown>();

function cached<T>(kind: string, locale: string, options: object, build: () => T): T {
  const key = `${kind}|${locale}|${JSON.stringify(options)}`;
  let value = cache.get(key) as T | undefined;
  if (!value) cache.set(key, (value = build()));
  return value;
}

export const numberFormat = (locale: string, options: Intl.NumberFormatOptions = {}) =>
  cached("number", locale, options, () => new Intl.NumberFormat(locale, options));

export const dateTimeFormat = (locale: string, options: Intl.DateTimeFormatOptions) =>
  cached("date", locale, options, () => new Intl.DateTimeFormat(locale, options));

export const relativeTimeFormat = (locale: string, options: Intl.RelativeTimeFormatOptions) =>
  cached("relative", locale, options, () => new Intl.RelativeTimeFormat(locale, options));

export const listFormat = (locale: string, options: Intl.ListFormatOptions) =>
  cached("list", locale, options, () => new Intl.ListFormat(locale, options));
