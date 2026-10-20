// @vitest-environment jsdom
import { DEFAULT_SETTINGS, type WallSettings } from "@boothwall/shared";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { EventProvider, type EventRuntime } from "#runtime";
import { createRuntimeFixture } from "#testing/runtime";

import { createSettingsClient } from "../data";
import { useLiveSettings } from "./useLiveSettings";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const settings = (eventName: string): WallSettings => ({ ...DEFAULT_SETTINGS, eventName });
const response = (value: WallSettings) => Response.json({ settings: value });
function deferred() {
  let resolve!: (value: Response) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<Response>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function mount(runtime = createRuntimeFixture()) {
  let live!: ReturnType<typeof useLiveSettings>;
  function Probe() {
    live = useLiveSettings();
    return null;
  }
  const tree = (next: EventRuntime) => (
    <EventProvider runtime={next}>
      <Probe />
    </EventProvider>
  );
  const view = render(tree(runtime));
  return {
    live: () => live,
    switchTo: (next: EventRuntime) => view.rerender(tree(next)),
    unmount: view.unmount,
  };
}

it("starts empty and publishes settings read through the current event transport", async () => {
  const pending = deferred();
  const fetch = vi.fn(() => pending.promise);
  vi.stubGlobal("fetch", fetch);
  const view = mount(createRuntimeFixture("initial"));
  expect(view.live()).toMatchObject({ settings: null, failed: false });
  expect(fetch).toHaveBeenCalledWith(
    new URL("https://api.example.test/settings?wall=initial"),
    expect.objectContaining({ credentials: "omit" }),
  );
  await act(async () => pending.resolve(response(settings("Initial wall"))));
  expect(view.live()).toMatchObject({ settings: settings("Initial wall"), failed: false });
});

it("refreshes only when visible, retains settings on a transient failure, and recovers on retry", async () => {
  const initial = settings("Already displayed");
  const recovered = settings("Fresh settings");
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(response(initial))
    .mockResolvedValueOnce(Response.json({ error: { code: "UNAVAILABLE" } }, { status: 503 }))
    .mockResolvedValueOnce(response(recovered));
  vi.stubGlobal("fetch", fetch);
  const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
  const view = mount();
  await waitFor(() => expect(view.live().settings).toEqual(initial));
  fireEvent(document, new Event("visibilitychange"));
  expect(fetch).toHaveBeenCalledTimes(1);
  visibility.mockReturnValue("visible");
  fireEvent(document, new Event("visibilitychange"));
  await waitFor(() => expect(view.live().failed).toBe(true));
  expect(view.live().settings).toEqual(initial);
  act(() => view.live().retry());
  await waitFor(() => expect(view.live().settings).toEqual(recovered));
  expect(view.live().failed).toBe(false);
});

it.each([
  ["replacement", "succeeds"],
  ["replacement", "fails"],
  ["save", "succeeds"],
  ["save", "fails"],
] as const)("keeps a newer %s when an older read %s", async (change, outcome) => {
  const pending = deferred();
  const accepted = settings("Accepted newer settings");
  vi.stubGlobal("fetch", (_url: URL, options: RequestInit) =>
    options.method === "PUT" ? Promise.resolve(response(accepted)) : pending.promise,
  );
  const runtime = createRuntimeFixture();
  const view = mount(runtime);
  await act(async () => {
    const next =
      change === "save"
        ? await createSettingsClient(runtime.transport).saveSettings(accepted)
        : accepted;
    view.live().replace(next);
  });
  expect(view.live().settings).toEqual(accepted);
  await act(async () => {
    if (outcome === "succeeds") pending.resolve(response(settings("Stale response")));
    else pending.reject(new Error("Old read disconnected"));
  });
  expect(view.live()).toMatchObject({ settings: accepted, failed: false });
});

it.each(["switch", "remount"] as const)(
  "keeps an old wall's delayed refresh out of a new scope after %s",
  async (transition) => {
    const oldRefresh = deferred();
    const newRead = deferred();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response(settings("Old wall")))
      .mockReturnValueOnce(oldRefresh.promise)
      .mockReturnValueOnce(newRead.promise);
    vi.stubGlobal("fetch", fetch);
    let view = mount(createRuntimeFixture("a"));
    await waitFor(() => expect(view.live().settings?.eventName).toBe("Old wall"));
    act(() => view.live().retry());
    const next = createRuntimeFixture("b");
    if (transition === "switch") view.switchTo(next);
    else {
      view.unmount();
      view = mount(next);
    }
    expect(view.live()).toMatchObject({ settings: null, failed: false });
    await act(async () => newRead.resolve(response(settings("New wall"))));
    expect(view.live().settings?.eventName).toBe("New wall");
    await act(async () => oldRefresh.resolve(response(settings("Late old wall"))));
    expect(view.live()).toMatchObject({ settings: settings("New wall"), failed: false });
  },
);
