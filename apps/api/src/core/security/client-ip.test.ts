import { describe, expect, it } from "vitest";

import { clientKey, hashClient } from "./client-ip";

describe("clientKey", () => {
  it("keeps IPv4 as is and groups IPv6 by its /64", () => {
    expect(clientKey("203.0.113.7")).toBe("203.0.113.7");
    expect(clientKey("2001:db8:aa:1:1111:2222:3333:4444")).toBe("2001:db8:aa:1::/64");
    expect(clientKey("2001:0db8:00aa:0001::9")).toBe("2001:db8:aa:1::/64");
    expect(clientKey("2001:db8::1")).toBe("2001:db8:0:0::/64");
  });
});

const key = "fixture-fingerprint-key-only-32-bytes";
const now = new Date("2026-10-14T12:00:00Z");
it("matches an independently calculated purpose-framed HMAC vector", async () => {
  expect(await hashClient("203.0.113.7", now, key, "photo-upload")).toBe(
    "hmac-v1:a174c70320e4fc38c1a07eba00a766f0ff25e321f0a0e1aa5af0a792af66a0a4",
  );
});
it("separates keys, purposes and UTC days, retaining the IPv6 /64 boundary", async () => {
  const original = await hashClient("203.0.113.7", now, key, "photo-upload");
  expect(await hashClient("203.0.113.7", now, key + "-other", "photo-upload")).not.toBe(original);
  expect(await hashClient("203.0.113.7", now, key, "admin-auth")).not.toBe(original);
  expect(
    await hashClient("203.0.113.7", new Date("2026-10-15T00:00:00Z"), key, "photo-upload"),
  ).not.toBe(original);
  expect(
    await hashClient("203.0.113.7", new Date("2026-10-14T23:59:59Z"), key, "photo-upload"),
  ).toBe(original);
  expect(await hashClient("2001:0db8:00aa:0001::9", now, key, "reaction")).toBe(
    await hashClient("2001:db8:aa:1:1111:2222:3333:4444", now, key, "reaction"),
  );
});
it.each([undefined, "", "short-passcode"])(
  "fails closed without a strong configured key",
  async (value) => {
    await expect(hashClient("unknown", now, value, "admin-auth")).rejects.toThrow(
      "Client fingerprint key unavailable",
    );
  },
);
