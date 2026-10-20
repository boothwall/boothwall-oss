import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS } from "#config";
import { receivedSettingsSchema } from "#wall";

import { eventYearSchema, hashtagSchema, wallSettingsSchema } from "./wall-settings.schemas.ts";

describe("event settings", () => {
  it("takes a hashtag with a leading # and no spaces", () => {
    expect(hashtagSchema.safeParse("#SpringFair26").success).toBe(true);
    expect(hashtagSchema.safeParse("SpringFair").success).toBe(false);
    expect(hashtagSchema.safeParse("#spring fair").success).toBe(false);
    expect(hashtagSchema.safeParse("#Ana&Ben").success).toBe(false);
    expect(hashtagSchema.safeParse("#ŠimeIAna").success).toBe(true);
    expect(hashtagSchema.safeParse("#Cafe\u0301").success).toBe(true);
    expect(hashtagSchema.safeParse("#नमस्ते").success).toBe(true);
    expect(hashtagSchema.safeParse("#Cafe\u0301").success).toBe(true);
    expect(hashtagSchema.safeParse("#नमस्ते").success).toBe(true);
  });

  it("takes four digits or nothing for the year", () => {
    expect(eventYearSchema.safeParse("2026").success).toBe(true);
    expect(eventYearSchema.safeParse("").success).toBe(true);
    expect(eventYearSchema.safeParse("26").success).toBe(false);
  });

  it("starts from the config's event", () => {
    expect(wallSettingsSchema.safeParse(DEFAULT_SETTINGS).success).toBe(true);
    expect(DEFAULT_SETTINGS.eventName.length).toBeGreaterThan(0);
    expect(DEFAULT_SETTINGS.eventHashtag.startsWith("#")).toBe(true);
  });

  it("refuses an empty name", () => {
    expect(wallSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, eventName: "  " }).success).toBe(
      false,
    );
  });
});

describe("received settings", () => {
  it("defaults legacy playback to running without reopening a closed event or intake", () => {
    const saved: Record<string, unknown> = {
      ...DEFAULT_SETTINGS,
      eventEnded: true,
      uploadsOpen: false,
    };
    delete saved.playbackPaused;
    const parsed = wallSettingsSchema.parse(saved);
    expect(parsed).toMatchObject({ playbackPaused: false, eventEnded: true, uploadsOpen: false });
    expect(receivedSettingsSchema.parse(saved)).toMatchObject(parsed);
    expect(wallSettingsSchema.parse({ ...saved, playbackPaused: true }).playbackPaused).toBe(true);
    expect(wallSettingsSchema.safeParse({ ...saved, playbackPaused: "false" }).success).toBe(false);
  });

  it("keeps settings saved before themes valid, on the original night theme", () => {
    const saved: Record<string, unknown> = { ...DEFAULT_SETTINGS };
    delete saved.theme;
    expect(wallSettingsSchema.parse(saved).theme).toBe("universal");
    expect(wallSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, theme: "disco" }).success).toBe(
      false,
    );
  });

  it("fills fields an older API doesn't send from the config", () => {
    const older: Record<string, unknown> = { ...DEFAULT_SETTINGS, announcement: "Hi" };
    for (const key of ["eventName", "eventHashtag", "eventYear"]) delete older[key];
    const parsed = receivedSettingsSchema.parse(older);
    expect(parsed.announcement).toBe("Hi");
    expect(parsed.eventHashtag).toBe(DEFAULT_SETTINGS.eventHashtag);
  });

  it("keeps settings saved before picks and the end screen existed valid", () => {
    const saved: Record<string, unknown> = { ...DEFAULT_SETTINGS };
    delete saved.showPicks;
    delete saved.eventEnded;
    const parsed = wallSettingsSchema.parse(saved);
    expect(parsed.showPicks).toBe(true);
    expect(parsed.eventEnded).toBe(false);
  });
});
