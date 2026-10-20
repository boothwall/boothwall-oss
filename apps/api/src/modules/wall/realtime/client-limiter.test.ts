import { describe, expect, it } from "vitest";

import { ClientLimiter } from "./client-limiter";

describe("ClientLimiter", () => {
  it("allows up to the limit per client in a window, then resets", () => {
    const limiter = new ClientLimiter();
    const take = (key: string, now: number) => limiter.take(key, 2, 1000, now);

    expect(take("a", 1000)).toBe(true);
    expect(take("a", 1100)).toBe(true);
    expect(take("a", 1200)).toBe(false);
    // Another client has its own count.
    expect(take("b", 1300)).toBe(true);
    // A new window starts from zero.
    expect(take("a", 2000)).toBe(true);
  });
});

it("counts still-active old hits with new hits without incrementing the legacy identifier", () => {
  const limiter = new ClientLimiter();
  expect(limiter.take("legacy", 2, 1000, 1000)).toBe(true);
  expect(limiter.take("keyed", 2, 1000, 1100, "legacy")).toBe(true);
  expect(limiter.take("keyed", 2, 1000, 1200, "legacy")).toBe(false);
  // New calls did not add to the old map entry; only the first legacy hit exists there.
  expect(limiter.take("legacy", 2, 1000, 1300)).toBe(true);
  expect(limiter.take("keyed", 2, 1000, 2000, "legacy")).toBe(true);
});
