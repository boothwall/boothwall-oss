import { describe, expect, it } from "vitest";

import { appPath, CONTROL_PATH, SNAP_PATH, WALL_PATH } from "./links.constants";

describe("appPath", () => {
  it("keeps root addresses as they are", () => {
    expect(appPath(WALL_PATH, "/")).toBe("/");
    expect(appPath(SNAP_PATH, "/")).toBe("/snap");
  });

  it("puts routes under the app's base path", () => {
    expect(appPath(WALL_PATH, "/demo/")).toBe("/demo/");
    expect(appPath(CONTROL_PATH, "/demo/")).toBe("/demo/control");
  });
});
