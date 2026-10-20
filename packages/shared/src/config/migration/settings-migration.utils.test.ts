import { describe, expect, it } from "vitest";

import { boothwallConfig } from "../boothwall.config.ts";
import { previewSettingsMigration } from "./settings-migration.utils.ts";

describe("saved settings migration preview", () => {
  it("preserves category identity, branding, empty text and explicit false without touching input", () => {
    const saved = JSON.stringify({
      eventName: "Garden party",
      eventHashtag: "#Garden",
      eventYear: "",
      categories: [
        { id: "old-guests", label: "Guests", catchAll: true },
        { id: "old-team", label: "Team" },
      ],
      presentation: {
        logoUrl: null,
        badge: "",
        theme: { primary: "#112233", secondary: "#445566", tertiary: "#778899" },
      },
      announcement: "",
      showWhoIsHere: false,
      autoOpen: false,
      uploadsOpen: false,
      playbackPaused: true,
    });
    const before = JSON.stringify(boothwallConfig);
    const preview = previewSettingsMigration(boothwallConfig, saved);
    expect(preview).toMatchObject({
      schemaVersion: 1,
      ready: true,
      configPatch: {
        event: { name: "Garden party", hashtag: "#Garden", year: "" },
        categories: [
          { id: "old-guests", label: "Guests", catchAll: true },
          { id: "old-team", label: "Team" },
        ],
        settings: {
          presentation: { logoUrl: null, badge: "" },
          announcement: "",
          showWhoIsHere: false,
          autoOpen: false,
        },
      },
      runtimeState: { uploadsOpen: false, playbackPaused: true, eventEnded: false },
    });
    expect(preview.configPatch.settings).not.toHaveProperty("uploadsOpen");
    expect(preview.configPatch.settings).not.toHaveProperty("playbackPaused");
    expect(preview.configPatch.settings).not.toHaveProperty("eventEnded");
    expect(JSON.stringify(boothwallConfig)).toBe(before);
  });

  it("uses configured defaults for absent fields and retains static announcement and counts", () => {
    const preview = previewSettingsMigration(
      {
        ...boothwallConfig,
        settings: {
          announcement: "Group photo at 18:00",
          showWhoIsHere: false,
        },
      },
      null,
    );
    expect(preview.configPatch.settings).toMatchObject({
      announcement: "Group photo at 18:00",
      showWhoIsHere: false,
      secondsPerPhoto: 7,
    });
    expect(preview.ready).toBe(true);
  });

  it.each(["{", "null", "[]", '"hello"', "false", ""])(
    "refuses a corrupt stored record %s",
    (stored) => {
      const preview = previewSettingsMigration(boothwallConfig, stored);
      expect(preview.ready).toBe(false);
      expect(preview.issues).toContainEqual(
        expect.objectContaining({ field: "$record", code: "invalid-record" }),
      );
    },
  );

  it("explains invalid, unsupported and unknown fields without leaking their values", () => {
    const preview = previewSettingsMigration(
      boothwallConfig,
      JSON.stringify({
        secondsPerPhoto: 100,
        smartModeration: { enabled: true, autoApproveSafe: true, holdFlagged: true },
        apiToken: "secret-do-not-export",
      }),
    );
    expect(preview.ready).toBe(false);
    expect(preview.issues.map(({ field }) => field)).toEqual(
      expect.arrayContaining(["secondsPerPhoto", "smartModeration", "apiToken"]),
    );
    expect(preview.configPatch.settings.secondsPerPhoto).toBe(7);
    expect(preview.configPatch.settings.smartModeration?.enabled).toBe(true);
    expect(JSON.stringify(preview)).not.toContain("secret-do-not-export");
  });

  it("rejects nested unrecognized fields rather than silently losing them", () => {
    const preview = previewSettingsMigration(
      boothwallConfig,
      JSON.stringify({ presentation: { badge: "Kept", unsupported: "secret" } }),
    );
    expect(preview.ready).toBe(false);
    expect(preview.issues).toContainEqual(
      expect.objectContaining({ field: "presentation.unsupported", code: "unknown-field" }),
    );
    expect(preview.configPatch.settings.presentation?.badge).toBe("Kept");
  });
});
