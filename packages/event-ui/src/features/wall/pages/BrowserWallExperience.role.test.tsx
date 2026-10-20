// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import type * as Canvas from "#features/wall/components/canvas";
import { EventProvider } from "#runtime";
import { createRuntimeFixture } from "#testing/runtime";

import { BrowserWallExperience } from "./BrowserWallExperience";

// The renderer is tested in wall-ui; this boundary asserts the display's role and navigation.
vi.mock("#features/wall/components/canvas", async (importOriginal) => ({
  ...(await importOriginal<typeof Canvas>()),
  WallFrame: () => <div role="img" aria-label="Shared wall renderer" />,
}));
afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});
it.each([false, true])(
  "keeps the renderer for touch-first=%s instead of substituting a feed",
  (touch) => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: touch && query.includes("coarse"),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const runtime = createRuntimeFixture();
    runtime.links.snap = "/snap?invite=guest";
    render(
      <EventProvider runtime={runtime}>
        <BrowserWallExperience />
      </EventProvider>,
    );
    expect(screen.getByRole("img", { name: "Shared wall renderer" })).toBeTruthy();
    if (touch) {
      const destination = new URL(
        screen.getByRole("link", { name: "Add your photo" }).getAttribute("href")!,
      );
      expect(destination.pathname).toBe("/snap");
      expect(destination.searchParams.get("invite")).toBe("guest");
    } else expect(screen.getByText("Press F for full screen")).toBeTruthy();
  },
);
it("keeps a kiosk display free of capture controls", () => {
  window.history.replaceState(null, "", "/?kiosk");
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("coarse"),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  render(
    <EventProvider runtime={createRuntimeFixture()}>
      <BrowserWallExperience />
    </EventProvider>,
  );
  expect(screen.getByRole("img", { name: "Shared wall renderer" })).toBeTruthy();
  expect(screen.queryByRole("link")).toBeNull();
});
