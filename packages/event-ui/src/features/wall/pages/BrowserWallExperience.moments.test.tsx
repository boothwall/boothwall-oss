// @vitest-environment jsdom
import type * as WallUI from "@boothwall/wall-ui";
import { REMOTE_HINT_MS, type WallScreenProps } from "@boothwall/wall-ui";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EventProvider, type EventRuntime } from "#runtime";
import { createRuntimeFixture } from "#testing/runtime";

import { BrowserWallExperience } from "./BrowserWallExperience";

// The relay from the phone remote to these requests is tested in wall-ui; this stands in for the
// screen, so a test can ask as the phone would and see what the wall's own keys receive.
const wall = vi.hoisted(() => ({
  props: null as WallScreenProps | null,
  select: vi.fn(),
  back: vi.fn(),
}));
vi.mock("@boothwall/wall-ui", async (importOriginal) => ({
  ...(await importOriginal<typeof WallUI>()),
  WallScreen: (props: WallScreenProps) => {
    wall.props = props;
    props.useRemoteInput({ select: wall.select, back: wall.back });
    return <div data-testid="wall-screen">{props.overlay}</div>;
  },
}));

const CALL = "Everyone,\nsnap a photo!";
const text = (value: string) => screen.queryByText((_, node) => node?.textContent === value);

function renderWall(wallMoments?: EventRuntime["wallMoments"]) {
  const runtime = { ...createRuntimeFixture(), demo: true, wallMoments };
  render(
    <EventProvider runtime={runtime}>
      <BrowserWallExperience />
    </EventProvider>,
  );
}
const ask = (request: "onPhotoCallRequest" | "onHintsRequest") =>
  act(() => wall.props?.[request]?.());
const press = (key: string) => act(() => void fireEvent.keyDown(window, { key }));

describe("photo call and remote help on the browser wall", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    wall.props = null;
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("runs a photo call to its closing card, then back to the wall", () => {
    renderWall({ photoCall: true, remoteHelp: true });
    ask("onPhotoCallRequest");
    expect(text(CALL)).toBeTruthy();
    expect(screen.getByText("1:00")).toBeTruthy();
    expect(screen.getByText("Esc returns to the wall")).toBeTruthy();

    act(() => vi.advanceTimersByTime(60_000));
    expect(text(CALL)).toBeNull();
    expect(screen.getByText("That's a wrap")).toBeTruthy();
    act(() => vi.advanceTimersByTime(5_000));
    expect(screen.queryByText("That's a wrap")).toBeNull();
  });

  it("ends the call on Escape without passing keys to the wall, or when asked again", () => {
    renderWall({ photoCall: true, remoteHelp: true });
    ask("onPhotoCallRequest");
    press("Enter");
    expect(wall.select).not.toHaveBeenCalled();
    // Past the grace after page load in which Escape counts as leaving full screen.
    act(() => vi.advanceTimersByTime(1000));
    press("Escape");
    expect(text(CALL)).toBeNull();
    expect(wall.back).not.toHaveBeenCalled();

    ask("onPhotoCallRequest");
    expect(text(CALL)).toBeTruthy();
    ask("onPhotoCallRequest");
    expect(text(CALL)).toBeNull();
  });

  it("shows the remote's keys and closes on its own, on any key or on a click", () => {
    renderWall({ photoCall: true, remoteHelp: true });
    ask("onHintsRequest");
    expect(screen.getByText("Remote")).toBeTruthy();
    expect(screen.getByText("Start or end a photo call")).toBeTruthy();
    act(() => vi.advanceTimersByTime(REMOTE_HINT_MS));
    expect(screen.queryByText("Remote")).toBeNull();

    ask("onHintsRequest");
    press("Enter");
    expect(screen.queryByText("Remote")).toBeNull();
    expect(wall.select).not.toHaveBeenCalled();

    ask("onHintsRequest");
    fireEvent.pointerDown(screen.getByTestId("wall-remote-help"));
    expect(screen.queryByText("Remote")).toBeNull();
  });

  it("keeps the help card away while a call runs", () => {
    renderWall({ photoCall: true, remoteHelp: true });
    ask("onHintsRequest");
    ask("onPhotoCallRequest");
    expect(screen.queryByText("Remote")).toBeNull();
    expect(wall.props?.onHintsRequest).toBeUndefined();
  });

  it("leaves both requests alone when the runtime doesn't offer them", () => {
    renderWall();
    expect(wall.props?.onPhotoCallRequest).toBeUndefined();
    expect(wall.props?.onHintsRequest).toBeUndefined();
    expect(wall.props?.onPhotosChange).toBeUndefined();
    expect(wall.props?.overlay).toBeFalsy();
  });

  it("drops the Escape line on a phone in landscape, and mounts no wall in portrait", () => {
    let portrait = false;
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("coarse") || (portrait && query.includes("orientation")),
      addEventListener() {},
      removeEventListener() {},
    }));
    renderWall({ photoCall: true, remoteHelp: true });
    ask("onPhotoCallRequest");
    expect(text(CALL)).toBeTruthy();
    expect(screen.queryByText("Esc returns to the wall")).toBeNull();

    cleanup();
    wall.props = null;
    portrait = true;
    renderWall({ photoCall: true, remoteHelp: true });
    expect(wall.props).toBeNull();
  });
});
