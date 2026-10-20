import { describe, expect, it } from "vitest";

import { isHotlinked } from "./photo.hotlink";

const allowed = ["https://wall.example.com"];
const self = "https://wall-api.example.com";

describe("isHotlinked", () => {
  it("lets our pages and non-browser clients through", () => {
    expect(isHotlinked({ referer: "https://wall.example.com/admin" }, allowed, self)).toBe(false);
    expect(isHotlinked({ secFetchSite: "same-site" }, allowed, self)).toBe(false);
    expect(isHotlinked({}, allowed, self)).toBe(false);
  });

  it("blocks other sites, even when they hide the referer", () => {
    expect(isHotlinked({ referer: "https://evil.example/page" }, allowed, self)).toBe(true);
    expect(isHotlinked({ secFetchSite: "cross-site" }, allowed, self)).toBe(true);
  });
});
