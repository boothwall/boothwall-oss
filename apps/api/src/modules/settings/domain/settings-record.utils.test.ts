import { DEFAULT_SETTINGS, type RuntimeSettingsPatch } from "@boothwall/shared";
import { expect, it } from "vitest";

import { resolveSettingsRecord, runtimeSettingsRecord } from "./settings-record.utils";

it("uses current file presentation while retaining only durable runtime state", () => {
  const record = runtimeSettingsRecord(null, { playbackPaused: true, uploadsOpen: false });
  const nextConfig = { ...DEFAULT_SETTINGS, announcement: "New file value", showWhoIsHere: false };
  expect(resolveSettingsRecord(record, "configured", nextConfig)).toEqual({
    authority: "configured",
    settings: { ...nextConfig, playbackPaused: true, uploadsOpen: false },
  });
  expect(() => resolveSettingsRecord(record, "stored")).toThrow();
});

it("preserves legacy fields and reports pending authority until explicit migration", () => {
  const raw = {
    announcement: "Original",
    unknownLegacy: { keep: true },
    secondsPerPhoto: "invalid",
  };
  const record = runtimeSettingsRecord(JSON.stringify(raw), { uploadsOpen: false });
  expect(JSON.parse(record)).toEqual({ ...raw, uploadsOpen: false });
  expect(resolveSettingsRecord(record)).toMatchObject({
    authority: "legacy-pending",
    settings: {
      announcement: "Original",
      secondsPerPhoto: DEFAULT_SETTINGS.secondsPerPhoto,
      uploadsOpen: false,
    },
  });
});

it("rejects hidden presentation, provenance or event changes even at the domain boundary", () => {
  for (const raw of [null, '{"announcement":"Original"}']) {
    for (const patch of [
      { uploadsOpen: false, announcement: "Hidden" },
      { playbackPaused: true, migration: {} },
      { uploadsOpen: false, eventEnded: false },
    ]) {
      expect(() => runtimeSettingsRecord(raw, patch as RuntimeSettingsPatch)).toThrow();
    }
  }
  for (const raw of [
    '{"kind":"configured-runtime","schemaVersion":0}',
    '{"runtimeState":{}}',
    '{"kind":"configured-runtime","schemaVersion":1,"runtimeState":{"uploadsOpen":true}}',
  ]) {
    expect(() => resolveSettingsRecord(raw)).toThrow();
  }
});
