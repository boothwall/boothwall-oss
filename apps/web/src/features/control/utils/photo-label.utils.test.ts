import { expect, it } from "vitest";

import { photoAge } from "./photo-label.utils";

it.each([
  [-90_000, "just now"],
  [30_000, "just now"],
  [125_000, "2 min ago"],
  [3 * 3_600_000, "3 h ago"],
  [50 * 3_600_000, "2 d ago"],
])("says a photo sent %i ms ago arrived %s", (ago, words) => {
  const now = Date.parse("2026-10-19T12:00:00.000Z");
  expect(photoAge(new Date(now - ago).toISOString(), now)).toBe(words);
});
