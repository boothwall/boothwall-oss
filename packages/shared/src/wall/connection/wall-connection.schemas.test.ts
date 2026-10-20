import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS } from "#config";

import { wallConnectionMetadataSchema } from "./wall-connection.schemas.ts";

const basic = {
  apiBaseUrl: "https://api.example.test",
  joinUrl: "https://wall.example.test/snap",
  sourceUrl: "https://source.example.test",
  sourceLabel: "Source",
  showSource: true,
  storageNamespace: "example:default",
  initialSettings: DEFAULT_SETTINGS,
};

describe("optional recap metadata", () => {
  it("accepts a basic display connection with no recap destination", () => {
    expect(wallConnectionMetadataSchema.parse(basic)).toEqual(basic);
  });

  it("preserves a supplied recap exactly and rejects malformed destinations", () => {
    const recapUrl = "https://wall.example.test/MixedCase/recap?share=AbC";
    expect(wallConnectionMetadataSchema.parse({ ...basic, recapUrl }).recapUrl).toBe(recapUrl);
    expect(
      wallConnectionMetadataSchema.safeParse({ ...basic, recapUrl: "javascript:alert(1)" }).success,
    ).toBe(false);
  });
});
