import type { DeviceLocale } from "#ports";

/**
 * The device's locale on a TV, from whatever the platform offers (Vega's
 * `I18nManager.getSystemLocale()`, Android's locale). The app injects it, so this package never
 * imports React Native. Anything missing reads as English in UTC.
 */
export function nativeDeviceLocale(
  systemLocale: () => string | null | undefined,
  systemTimeZone: () => string | null | undefined = () =>
    Intl.DateTimeFormat().resolvedOptions().timeZone,
): DeviceLocale {
  return {
    languages: () => {
      const tag = systemLocale()?.trim();
      return tag ? [tag.replace("_", "-")] : [];
    },
    timeZone: () => systemTimeZone() || "UTC",
  };
}
