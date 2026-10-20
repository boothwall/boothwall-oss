import { describe, expect, it } from "vitest";

import { createStandaloneEventRuntime } from "./standalone-event.runtime";

describe("createStandaloneEventRuntime", () => {
  it("links the source on the phone pages and keeps the wall's card off by default", () => {
    // The example config sets no `credits`.
    const { presentation } = createStandaloneEventRuntime(() => "");
    expect(presentation.showSourceOnGuest).toBe(true);
    expect(presentation.showSourceOnWall).toBe(false);
  });
});
