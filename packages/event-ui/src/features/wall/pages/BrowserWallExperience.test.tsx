// @vitest-environment jsdom
import { EVENT } from "@boothwall/shared";
import { act, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HINT_VISIBLE_MS } from "#features/wall/constants";
import { EventProvider } from "#runtime";
import { createRuntimeFixture } from "#testing/runtime";

import { BrowserWallExperience } from "./BrowserWallExperience";
const runtime = createRuntimeFixture();
runtime.demo = true;
runtime.presentation.badge = "BOOTH 14";
function WallPage() {
  return (
    <EventProvider runtime={runtime}>
      <BrowserWallExperience />
    </EventProvider>
  );
}

/** Demo mode still opens the socket for phone remote commands; keep it offline here. */
class OfflineSocket {
  static readonly OPEN = 1;
  readyState = 0;
  onopen = null;
  onmessage = null;
  onerror = null;
  onclose = null;
  send() {}
  close() {}
}

/** matchMedia that matches only the given queries. */
const stubMedia = (...matching: string[]) =>
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: matching.includes(query),
    addEventListener() {},
    removeEventListener() {},
  }));

describe("WallPage", () => {
  beforeEach(() => vi.stubGlobal("WebSocket", OfflineSocket));
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    window.history.replaceState(null, "", "/");
  });

  it("renders the shared TV wall in demo mode", () => {
    render(<WallPage />);

    expect(screen.getByTestId("wall-screen")).toBeTruthy();
    expect(within(screen.getByTestId("wall-header")).getByText(EVENT.hashtag)).toBeTruthy();
    expect(screen.getByTestId("badge-chip").textContent).toBe("BOOTH 14");
  });

  it("shows the full screen hint, then fades it out", () => {
    vi.useFakeTimers();
    render(<WallPage />);

    const hint = screen.getByTestId("fullscreen-hint");
    expect(hint.textContent).toBe("Press F for full screen");
    expect(hint.getAttribute("aria-hidden")).toBe("false");

    act(() => vi.advanceTimersByTime(HINT_VISIBLE_MS));
    expect(hint.getAttribute("aria-hidden")).toBe("true");
  });

  it.each(["?kiosk", "?fullscreen"])("hides the hint with %s", (search) => {
    window.history.replaceState(null, "", `/wall${search}`);
    render(<WallPage />);

    expect(screen.queryByTestId("fullscreen-hint")).toBeNull();
    expect(screen.getByRole("main").className).toContain("cursor-none");
  });

  it("offers phones the upload page instead of the hint", () => {
    stubMedia("(pointer: coarse)");
    render(<WallPage />);

    const snap = new URL(
      screen.getByTestId("snap-button").getAttribute("href")!,
      window.location.href,
    );
    expect(snap.pathname).toBe("/snap");
    expect(snap.searchParams.get("lang")).toBe("en");
    expect(screen.queryByTestId("fullscreen-hint")).toBeNull();
  });

  it("replaces the miniature portrait phone wall with rotation guidance", () => {
    stubMedia("(pointer: coarse)", "(orientation: portrait) and (max-width: 1024px)");
    window.history.replaceState(null, "", "/?demo");
    render(<WallPage />);

    expect(screen.queryByTestId("wall-screen")).toBeNull();
    expect(screen.getByRole("heading", { name: "Turn your phone sideways" })).toBeTruthy();
    expect(screen.getByTestId("phone-wall-status")).toBeTruthy();
    expect(screen.getByTestId("snap-button")).toBeTruthy();
  });
  it("follows rotation in both directions without leaving a portrait wall mounted", () => {
    let portrait = true;
    const listeners = new Set<() => void>();
    vi.stubGlobal("matchMedia", (query: string) => ({
      get matches() {
        return query.includes("coarse") || (portrait && query.includes("orientation"));
      },
      addEventListener(_event: string, listener: () => void) {
        listeners.add(listener);
      },
      removeEventListener(_event: string, listener: () => void) {
        listeners.delete(listener);
      },
    }));
    render(<WallPage />);
    expect(screen.queryByTestId("wall-screen")).toBeNull();
    act(() => {
      portrait = false;
      listeners.forEach((listener) => listener());
    });
    expect(screen.getByTestId("wall-screen")).toBeTruthy();
    expect(screen.queryByTestId("phone-wall-status")).toBeNull();
    act(() => {
      portrait = true;
      listeners.forEach((listener) => listener());
    });
    expect(screen.queryByTestId("wall-screen")).toBeNull();
    expect(screen.getByTestId("phone-wall-status")).toBeTruthy();
  });

  it("keeps a fine-pointer portrait desktop on the wall", () => {
    stubMedia("(orientation: portrait) and (max-width: 1024px)");
    render(<WallPage />);
    expect(screen.getByTestId("wall-screen")).toBeTruthy();
    expect(screen.queryByTestId("phone-wall-status")).toBeNull();
  });

  it("does not let kiosk bypass phone portrait guidance or expose a capture control", () => {
    stubMedia("(pointer: coarse)", "(orientation: portrait) and (max-width: 1024px)");
    window.history.replaceState(null, "", "/?kiosk");
    render(<WallPage />);
    expect(screen.queryByTestId("wall-screen")).toBeNull();
    expect(screen.getByTestId("phone-wall-status")).toBeTruthy();
    expect(screen.queryByTestId("snap-button")).toBeNull();
  });
});
