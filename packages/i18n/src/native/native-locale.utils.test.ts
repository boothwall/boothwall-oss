import { describe, expect, it } from "vitest";

import { pickLanguage } from "#negotiate";

import { nativeDeviceLocale } from "./native-locale.utils.ts";

describe("nativeDeviceLocale", () => {
  it("turns the platform's locale into device languages", () => {
    const device = nativeDeviceLocale(
      () => "hr_HR",
      () => "Europe/Zagreb",
    );
    expect(device.languages()).toEqual(["hr-HR"]);
    expect(pickLanguage(device.languages())).toBe("hr");
    expect(device.timeZone()).toBe("Europe/Zagreb");
  });

  it("reads a silent platform as no languages in UTC", () => {
    const device = nativeDeviceLocale(
      () => undefined,
      () => "",
    );
    expect(device.languages()).toEqual([]);
    expect(device.timeZone()).toBe("UTC");
  });
});
