import { describe, expect, it } from "vitest";

import { resolveRoute, routeOf } from "./routes";

describe("resolveRoute", () => {
  it.each([
    ["/", "wall"],
    ["/snap", "snap"],
    ["/control", "control"],
    ["/control/live", "control"],
    ["/control/guests", "control"],
    ["/recap", "not-found"],
    ["/control/print", "not-found"],
    ["/try", "not-found"],
    ["/anything-else", "not-found"],
    ["/snapshot", "not-found"],
    ["/controller", "not-found"],
  ])("serves %s as the %s screen", (pathname, screen) => {
    expect(resolveRoute(pathname)).toEqual({ screen });
  });

  it.each([
    ["/admin", "control", "/control"],
    ["/admin/queue", "control", "/control"],
    ["/wall", "wall", "/"],
    ["/SNAP", "snap", "/snap"],
    ["/ADMIN", "control", "/control"],
    ["/Control/Live/", "control", "/control/live"],
  ])("moves %s to its canonical address", (pathname, screen, redirectTo) => {
    expect(resolveRoute(pathname)).toEqual({ screen, redirectTo });
  });
});

describe("routeOf", () => {
  it("leaves addresses alone when the app is served from the root", () => {
    expect(routeOf("/snap", "/")).toBe("/snap");
  });

  it.each([
    ["/demo", "/"],
    ["/demo/", "/"],
    ["/demo/snap", "/snap"],
    ["/DEMO/SNAP", "/SNAP"],
    ["/demo/admin/queue", "/admin/queue"],
  ])("serves %s as %s under /demo/", (pathname, route) => {
    expect(routeOf(pathname, "/demo/")).toBe(route);
  });

  it("matches nothing outside the base path", () => {
    expect(routeOf("/snap", "/demo/")).toBe("");
    expect(routeOf("/demolition", "/demo/")).toBe("");
    expect(resolveRoute(routeOf("/snap", "/demo/"))).toEqual({ screen: "not-found" });
  });
});
