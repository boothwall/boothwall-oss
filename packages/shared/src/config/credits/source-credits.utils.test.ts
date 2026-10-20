import { describe, expect, it } from "vitest";

import { sourceCredits } from "./source-credits.utils.ts";

describe("source credits", () => {
  it("links the source on the phone pages but keeps the wall's card off by default", () => {
    expect(sourceCredits(undefined)).toEqual({ guest: true, wall: false });
  });

  it("shows the wall's card only with credits: true", () => {
    expect(sourceCredits(true)).toEqual({ guest: true, wall: true });
  });

  it("hides both with credits: false", () => {
    expect(sourceCredits(false)).toEqual({ guest: false, wall: false });
  });
});
