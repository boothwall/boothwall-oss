// @vitest-environment jsdom
import { DEFAULT_SETTINGS } from "@boothwall/shared";
import { afterEach, expect, it, vi } from "vitest";

import { createRuntimeFixture, photoFixture } from "#testing/runtime";

import { watchApproval } from "./watchApproval";
class Socket {
  static OPEN = 1;
  static instances: Socket[] = [];
  readyState = 1;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  send = vi.fn();
  close = vi.fn();
  constructor(readonly url: string) {
    Socket.instances.push(this);
  }
}
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  Socket.instances = [];
});
it("discards a late polling response after stopping", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("WebSocket", Socket);
  let finish!: (response: Response) => void;
  vi.stubGlobal(
    "fetch",
    () =>
      new Promise<Response>((resolve) => {
        finish = resolve;
      }),
  );
  const approved = vi.fn();
  const stop = watchApproval(createRuntimeFixture("a").transport, "p1", approved);
  expect(Socket.instances[0]?.url).toBe("wss://api.example.test/wall/live?wall=a");
  await vi.advanceTimersByTimeAsync(5000);
  stop();
  finish(
    Response.json({
      photos: [photoFixture],
      settings: DEFAULT_SETTINGS,
      stats: { total: 1, byTribe: {} },
    }),
  );
  await Promise.resolve();
  await Promise.resolve();
  expect(approved).not.toHaveBeenCalled();
  expect(Socket.instances[0]?.close).toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(10000);
  expect(Socket.instances).toHaveLength(1);
});
it("reconnects on the same wall and reports one live arrival", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("WebSocket", Socket);
  const approved = vi.fn();
  watchApproval(createRuntimeFixture("b").transport, "p1", approved);
  Socket.instances[0]!.onclose?.();
  await vi.advanceTimersByTimeAsync(3000);
  expect(Socket.instances.length).toBe(2);
  const current = Socket.instances[1]!;
  expect(current.url).toContain("wall=b");
  current.onmessage?.({
    data: JSON.stringify({
      type: "photo.created",
      photo: photoFixture,
      stats: { total: 1, byTribe: {} },
    }),
  });
  expect(approved).toHaveBeenCalledTimes(1);
  expect(current.close).toHaveBeenCalled();
});

it("detects approval through polling when the socket never opens", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("WebSocket", Socket);
  vi.stubGlobal("fetch", async () =>
    Response.json({
      photos: [photoFixture],
      settings: DEFAULT_SETTINGS,
      stats: { total: 1, byTribe: {} },
    }),
  );
  const approved = vi.fn();
  watchApproval(createRuntimeFixture("a").transport, "p1", approved);
  await vi.advanceTimersByTimeAsync(5000);
  expect(approved).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(10000);
  expect(approved).toHaveBeenCalledTimes(1);
});

it("asks the photo's status with its delete token and hears a decline", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("WebSocket", Socket);
  const requests: Request[] = [];
  const states = ["waiting", "declined"];
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    requests.push(new Request(url, init));
    return Response.json({ state: states.shift() });
  });
  const approved = vi.fn();
  const declined = vi.fn();
  watchApproval(createRuntimeFixture("a").transport, "p1", approved, {
    deleteToken: "mine",
    onDeclined: declined,
  });
  await vi.advanceTimersByTimeAsync(5000);
  expect(declined).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(5000);
  expect(declined).toHaveBeenCalledTimes(1);
  expect(approved).not.toHaveBeenCalled();
  expect(requests.map((request) => new URL(request.url).pathname)).toEqual([
    "/photos/p1/status",
    "/photos/p1/status",
  ]);
  expect(requests[0]?.headers.get("x-delete-token")).toBe("mine");
  await vi.advanceTimersByTimeAsync(10000);
  expect(requests).toHaveLength(2);
});

it("watches the wall instead when the host has no status route for this photo", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("WebSocket", Socket);
  const paths: string[] = [];
  vi.stubGlobal("fetch", async (url: string) => {
    const path = new URL(url).pathname;
    paths.push(path);
    if (path.endsWith("/status"))
      return Response.json({ error: { code: "DEMO_ROUTE_NOT_FOUND" } }, { status: 404 });
    return Response.json({
      photos: paths.length > 2 ? [photoFixture] : [],
      settings: DEFAULT_SETTINGS,
      stats: { total: 1, byTribe: {} },
    });
  });
  const approved = vi.fn();
  const declined = vi.fn();
  watchApproval(createRuntimeFixture("a").transport, "p1", approved, {
    deleteToken: "mine",
    onDeclined: declined,
  });
  await vi.advanceTimersByTimeAsync(10000);
  expect(paths).toEqual(["/photos/p1/status", "/photos", "/photos"]);
  expect(approved).toHaveBeenCalledTimes(1);
  expect(declined).not.toHaveBeenCalled();
});
