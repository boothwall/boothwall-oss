import {
  dateTimeFormat,
  listFormat,
  numberFormat,
  relativeTimeFormat,
} from "./intl-cache.utils.ts";

/** A calendar day with no zone ("2026-10-24"), as people plan events. */
export type CalendarDay = string;

export type FormatterOptions = {
  /** From `formatLocale`; always explicit, never the runtime default. */
  locale: string;
  /** The zone instants are shown in: the event's for event times, the device's otherwise. */
  timeZone: string;
};

// Calendar days are shown at UTC noon, so a day never slips across a daylight-saving change.
const noon = (day: CalendarDay) => new Date(`${day}T12:00:00Z`);
const DAY = { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" } as const;

/** Every way the product writes numbers, money, dates and lists, pinned to one locale and zone. */
export function createFormatters({ locale, timeZone }: FormatterOptions) {
  const at = (options: Intl.DateTimeFormatOptions) =>
    dateTimeFormat(locale, { ...options, timeZone });
  return {
    locale,
    timeZone,
    number: (value: number, options?: Intl.NumberFormatOptions) =>
      numberFormat(locale, options).format(value),
    /** An amount in minor units, with the currency's own decimals ("12,34 €", "¥1,234"). */
    money(amountMinor: number, currency: string) {
      const format = numberFormat(locale, { style: "currency", currency });
      const digits = format.resolvedOptions().maximumFractionDigits ?? 2;
      return format.format(amountMinor / 10 ** digits);
    },
    date: (instant: number | Date) => at({ dateStyle: "medium" }).format(instant),
    time: (instant: number | Date) => at({ timeStyle: "short" }).format(instant),
    dateTime: (instant: number | Date) =>
      at({ dateStyle: "medium", timeStyle: "short" }).format(instant),
    dateTimeRange: (from: number | Date, to: number | Date) =>
      at({ dateStyle: "medium", timeStyle: "short" }).formatRange(from, to),
    /** The zone's name as people read it ("CEST", "GMT+2"). */
    zoneName: (instant: number | Date) =>
      at({ timeZoneName: "short" })
        .formatToParts(instant)
        .find((part) => part.type === "timeZoneName")?.value ?? timeZone,
    day: (day: CalendarDay) => dateTimeFormat(locale, DAY).format(noon(day)),
    dayRange: (startsOn: CalendarDay, endsOn: CalendarDay | null) =>
      !endsOn || endsOn === startsOn
        ? dateTimeFormat(locale, DAY).format(noon(startsOn))
        : dateTimeFormat(locale, DAY).formatRange(noon(startsOn), noon(endsOn)),
    month: (day: CalendarDay) =>
      dateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(noon(day)),
    relative: (value: number, unit: Intl.RelativeTimeFormatUnit) =>
      relativeTimeFormat(locale, { numeric: "auto" }).format(value, unit),
    list: (items: readonly string[], type: Intl.ListFormatType = "conjunction") =>
      listFormat(locale, { type }).format(items),
  };
}

export type Formatters = ReturnType<typeof createFormatters>;
