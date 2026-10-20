import { describe, expect, it } from "vitest";

import { webBasePath, webOrigin } from "./web-address.utils.ts";

describe("web address", () => {
  it("serves from the root at a bare origin", () => {
    expect(webBasePath("https://wall.example.com")).toBe("/");
    expect(webBasePath("https://wall.example.com/")).toBe("/");
  });

  it("serves from a sub-path, with or without a trailing slash", () => {
    expect(webBasePath("https://example.com/demo")).toBe("/demo/");
    expect(webBasePath("https://example.com/events/demo/")).toBe("/events/demo/");
  });

  it("gives browsers' Origin without the path", () => {
    expect(webOrigin("https://example.com/demo")).toBe("https://example.com");
    expect(webOrigin("http://10.0.0.2:5173")).toBe("http://10.0.0.2:5173");
    expect(webOrigin("https://Example.com/demo?x=1")).toBe("https://example.com");
  });

  it("refuses anything but an http(s) address", () => {
    expect(() => webBasePath("ftp://example.com")).toThrow(/http\(s\)/);
  });
});
