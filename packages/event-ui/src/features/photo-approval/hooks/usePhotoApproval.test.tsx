// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
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
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

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
