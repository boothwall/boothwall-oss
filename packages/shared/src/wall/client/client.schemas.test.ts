import { describe, expect, it } from "vitest";

import { clientDescriptorSchema, supportedClientCapabilities } from "./client.schemas.ts";

const descriptor = {
  schemaVersion: 1,
  platform: "web",
  version: "1.2.0",
  build: "local-7",
  protocolVersion: 1,
  capabilities: ["identify", "future-action", "set-playback"],
};

describe("neutral display descriptor", () => {
  it("preserves unknown optional capabilities without advertising them as supported", () => {
    const parsed = clientDescriptorSchema.parse(descriptor);
    expect(parsed.capabilities).toEqual(descriptor.capabilities);
    expect(supportedClientCapabilities(parsed)).toEqual(["identify", "set-playback"]);
    expect(supportedClientCapabilities({ ...parsed, capabilities: [] })).toEqual([]);
  });

  it.each(["web", "fire-tv-vega", "fire-tv-android", "unknown"])(
    "accepts platform %s",
    (platform) => {
      expect(clientDescriptorSchema.parse({ ...descriptor, platform }).platform).toBe(platform);
    },
  );

  it.each([
    { schemaVersion: 2 },
    { protocolVersion: 0 },
    { protocolVersion: 1.5 },
    { protocolVersion: Number.MAX_SAFE_INTEGER + 1 },
    { platform: "invented" },
    { version: "" },
    { build: "" },
    { capabilities: [""] },
    { capabilities: "identify" },
  ])("rejects malformed descriptor %j", (patch) => {
    expect(clientDescriptorSchema.safeParse({ ...descriptor, ...patch }).success).toBe(false);
  });

  it("drops unrelated management and commercial data from the public descriptor", () => {
    expect(
      clientDescriptorSchema.parse({
        ...descriptor,
        accountId: "private",
        plan: "paid",
        secret: "fixture",
      }),
    ).toEqual(descriptor);
  });
});
