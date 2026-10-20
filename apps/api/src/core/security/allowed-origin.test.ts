import { describe, expect, it } from "vitest";

import { isAllowedOrigin } from "./allowed-origin";

describe("isAllowedOrigin", () => {
  const allowed = ["https://wall.example.com", "http://localhost:*"];

  it("matches exact origins and any port on a wildcard host, nothing else", () => {
    expect(isAllowedOrigin("https://wall.example.com", allowed)).toBe(true);
    expect(isAllowedOrigin("http://localhost:5174", allowed)).toBe(true);
    expect(isAllowedOrigin("http://localhost", allowed)).toBe(true);
    expect(isAllowedOrigin("http://localhost.evil.example", allowed)).toBe(false);
    expect(isAllowedOrigin("http://localhost:80.evil.example", allowed)).toBe(false);
    expect(isAllowedOrigin("https://wall.example.com:8443", allowed)).toBe(false);
  });
});
