// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";

import { EventProvider } from "#runtime";
import { createRuntimeFixture } from "#testing/runtime";

import { usePhotoApproval } from "./usePhotoApproval";

class Socket {
  static OPEN = 1;
  readyState = 0;
  onopen = null;
  onclose = null;
  onmessage = null;
  send = vi.fn();
  close = vi.fn();
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it.each(["pending", "approved"] as const)(
  "replaces Live with Declined for an initially %s photo",
  async (status) => {
    vi.useFakeTimers();
    vi.stubGlobal("WebSocket", Socket);
    const states = ["live", "live", "declined"];
    const fetch = vi.fn(async () => Response.json({ state: states.shift() }));
    vi.stubGlobal("fetch", fetch);
    const runtime = createRuntimeFixture();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <EventProvider runtime={runtime}>{children}</EventProvider>
    );
    const { result } = renderHook(() => usePhotoApproval({ id: "p1", status }, "mine"), {
      wrapper,
    });
    if (status === "approved") expect(result.current.live).toBe(true);
    await act(() => vi.advanceTimersByTimeAsync(10_000));
    expect(result.current).toEqual({ live: true, slow: false, state: "live" });
    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(result.current).toEqual({ live: false, slow: false, state: "declined" });
    await act(() => vi.advanceTimersByTimeAsync(10_000));
    expect(fetch).toHaveBeenCalledTimes(3);
  },
);

it("does not start monitoring an auto-approved photo without a token", async () => {
  vi.useFakeTimers();
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  const runtime = createRuntimeFixture();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <EventProvider runtime={runtime}>{children}</EventProvider>
  );
  const { result } = renderHook(() => usePhotoApproval({ id: "p1", status: "approved" }), {
    wrapper,
  });
  await act(() => vi.advanceTimersByTimeAsync(20_000));
  expect(result.current.live).toBe(true);
  expect(fetch).not.toHaveBeenCalled();
});

it("stops monitoring at the original 15-minute deadline even after late approval", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("WebSocket", Socket);
  const start = Date.now();
  const fetch = vi.fn(async () =>
    Response.json({ state: Date.now() - start < 890_000 ? "waiting" : "live" }),
  );
  vi.stubGlobal("fetch", fetch);
  const runtime = createRuntimeFixture();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <EventProvider runtime={runtime}>{children}</EventProvider>
  );
  const { result } = renderHook(() => usePhotoApproval({ id: "p1", status: "pending" }, "mine"), {
    wrapper,
  });
  await act(() => vi.advanceTimersByTimeAsync(895_000));
  expect(result.current.live).toBe(true);
  expect(fetch).toHaveBeenCalledTimes(179);
  await act(() => vi.advanceTimersByTimeAsync(5000));
  const requests = fetch.mock.calls.length;
  await act(() => vi.advanceTimersByTimeAsync(60_000));
  expect(fetch).toHaveBeenCalledTimes(requests);
});

it.each(["removed", "another", "runtime", "unmount"])(
  "disposes in-flight status on %s",
  async (change) => {
    vi.useFakeTimers();
    vi.stubGlobal("WebSocket", Socket);
    let resolve!: (response: Response) => void;
    const fetch = vi.fn(
      () =>
        new Promise<Response>((done) => {
          resolve = done;
        }),
    );
    vi.stubGlobal("fetch", fetch);
    const runtimeA = createRuntimeFixture("a");
    const runtimeB = createRuntimeFixture("b");
    let runtime = runtimeA;
    const { result, rerender, unmount } = renderHook(
      ({ id }) => usePhotoApproval(id ? { id, status: "pending" } : null, "mine"),
      {
        initialProps: { id: "p1" as string | null },
        wrapper: ({ children }: { children: ReactNode }) => (
          <EventProvider runtime={runtime}>{children}</EventProvider>
        ),
      },
    );
    await act(() => vi.advanceTimersByTimeAsync(5000));
    if (change === "unmount") unmount();
    else {
      if (change === "runtime") runtime = runtimeB;
      rerender({ id: change === "another" ? "p2" : change === "runtime" ? "p1" : null });
    }
    resolve(Response.json({ state: "declined" }));
    await act(() => vi.advanceTimersByTimeAsync(0));
    if (change !== "unmount") expect(result.current.state).not.toBe("declined");
    const requests = fetch.mock.calls.length;
    unmount();
    await act(() => vi.advanceTimersByTimeAsync(10_000));
    expect(fetch).toHaveBeenCalledTimes(requests);
  },
);

it("goes from waiting to slow to declined with the delete token", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("WebSocket", Socket);
  const states = ["waiting", "waiting", "waiting", "declined"];
  vi.stubGlobal("fetch", async (url: URL) =>
    url.pathname === "/photos/p1/status"
      ? Response.json({ state: states.shift() })
      : Response.json({ error: { code: "UNEXPECTED" } }, { status: 500 }),
  );
  const runtime = createRuntimeFixture();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <EventProvider runtime={runtime}>{children}</EventProvider>
  );
  const photo = { id: "p1", status: "pending" as const };
  const { result } = renderHook(() => usePhotoApproval(photo, "mine"), { wrapper });
  expect(result.current).toEqual({ live: false, slow: false, state: "waiting" });
  await act(() => vi.advanceTimersByTimeAsync(15_000));
  expect(result.current).toEqual({ live: false, slow: true, state: "waiting" });
  await act(() => vi.advanceTimersByTimeAsync(5_000));
  expect(result.current).toEqual({ live: false, slow: false, state: "declined" });
});
