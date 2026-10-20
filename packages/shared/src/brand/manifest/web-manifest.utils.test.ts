import { describe, expect, it } from "vitest";

import { SURFACES } from "../surfaces/surfaces.constants.ts";
import { webManifest } from "./web-manifest.utils.ts";

describe("webManifest", () => {
  it("takes its colours from the shared canvas and lists the rendered icons", () => {
    const manifest = JSON.parse(
      webManifest({ name: "Wall", shortName: "Wall", description: "A wall" }),
    );
    expect(manifest.theme_color).toBe(SURFACES.canvas);
    expect(manifest.background_color).toBe(SURFACES.canvas);
    expect(manifest.icons.map((icon: { src: string }) => icon.src)).toEqual([
      "/pwa-192.png",
      "/pwa-512.png",
      "/pwa-maskable-192.png",
      "/pwa-maskable-512.png",
    ]);
  });

  it("starts and finds its icons under the path the app is served from", () => {
    const manifest = JSON.parse(
      webManifest({ name: "Wall", shortName: "Wall", description: "A wall", base: "/demo/" }),
    );
    expect(manifest.start_url).toBe("/demo/");
    expect(manifest.icons[0].src).toBe("/demo/pwa-192.png");
  });
});
