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

it.each([false, true])(
  "hears host removal after Live (socket arrival: %s)",
  async (socketFirst) => {
    vi.useFakeTimers();
    vi.stubGlobal("WebSocket", Socket);
    const states = ["waiting", "live", "live", "declined"];
    const fetch = vi.fn(async () => Response.json({ state: states.shift() }));
    vi.stubGlobal("fetch", fetch);
    const approved = vi.fn();
    const declined = vi.fn();
    watchApproval(createRuntimeFixture().transport, "p1", approved, {
      deleteToken: "mine",
      onDeclined: declined,
    });
    await vi.advanceTimersByTimeAsync(5000);
    if (socketFirst) {
      const arrival = Socket.instances[0]!.onmessage!;
      const event = {
        data: JSON.stringify({
          type: "photo.created",
          photo: photoFixture,
          stats: { total: 1, byTribe: {} },
        }),
      };
      arrival(event);
      arrival(event);
    }
    await vi.advanceTimersByTimeAsync(10_000);
    expect(approved).toHaveBeenCalledTimes(1);
    expect(declined).not.toHaveBeenCalled();
    const lateArrival = Socket.instances[0]!.onmessage;
    await vi.advanceTimersByTimeAsync(5000);
    expect(declined).toHaveBeenCalledTimes(1);
    lateArrival?.({
      data: JSON.stringify({
        type: "photo.created",
        photo: photoFixture,
        stats: { total: 1, byTribe: {} },
      }),
    });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(approved).toHaveBeenCalledTimes(1);
    expect(declined).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(4);
    expect(Socket.instances[0]!.close).toHaveBeenCalled();
  },
);

it.each([403, 404])(
  "keeps one-shot fallback when status is unsupported or refused (%s)",
  async (status) => {
    vi.useFakeTimers();
    vi.stubGlobal("WebSocket", Socket);
    const fetch = vi.fn(async (url: URL) =>
      url.pathname.endsWith("/status")
        ? Response.json(
            { error: { code: status === 403 ? "PHOTO_STATUS_FORBIDDEN" : "DEMO_ROUTE_NOT_FOUND" } },
            { status },
          )
        : Response.json({
            photos: [photoFixture],
            settings: DEFAULT_SETTINGS,
            stats: { total: 1, byTribe: {} },
          }),
    );
    vi.stubGlobal("fetch", fetch);
    const approved = vi.fn();
    const declined = vi.fn();
    watchApproval(createRuntimeFixture().transport, "p1", approved, {
      deleteToken: "mine",
      onDeclined: declined,
    });
    await vi.advanceTimersByTimeAsync(15_000);
    expect(approved).toHaveBeenCalledTimes(1);
    expect(declined).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(2);
  },
);

it("recovers from a temporary error after Live without duplicate approval", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("WebSocket", Socket);
  let attempt = 0;
  vi.stubGlobal("fetch", async () => {
    attempt++;
    if (attempt === 2) return Response.json({ error: { code: "BUSY" } }, { status: 503 });
    return Response.json({ state: attempt < 3 ? "live" : "declined" });
  });
  const approved = vi.fn();
  const declined = vi.fn();
  watchApproval(createRuntimeFixture().transport, "p1", approved, {
    deleteToken: "mine",
    onDeclined: declined,
  });
  await vi.advanceTimersByTimeAsync(10_000);
  expect(approved).toHaveBeenCalledTimes(1);
  expect(declined).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(5000);
  expect(declined).toHaveBeenCalledTimes(1);
});

it("discards a token status response after disposal even after socket approval", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("WebSocket", Socket);
  let resolve!: (response: Response) => void;
  vi.stubGlobal(
    "fetch",
    () =>
      new Promise<Response>((done) => {
        resolve = done;
      }),
  );
  const approved = vi.fn();
  const declined = vi.fn();
  const stop = watchApproval(createRuntimeFixture().transport, "p1", approved, {
    deleteToken: "mine",
    onDeclined: declined,
  });
  await vi.advanceTimersByTimeAsync(5000);
  Socket.instances[0]!.onmessage?.({
    data: JSON.stringify({
      type: "photo.created",
      photo: photoFixture,
      stats: { total: 1, byTribe: {} },
    }),
  });
  stop();
  resolve(Response.json({ state: "declined" }));
  await vi.advanceTimersByTimeAsync(10_000);
  expect(approved).toHaveBeenCalledTimes(1);
  expect(declined).not.toHaveBeenCalled();
  expect(Socket.instances).toHaveLength(1);
});

it("accepts an in-flight decline after socket approval without overlapping status reads", async () => {
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
  const approved = vi.fn();
  const declined = vi.fn();
  watchApproval(createRuntimeFixture().transport, "p1", approved, {
    deleteToken: "mine",
    onDeclined: declined,
  });
  await vi.advanceTimersByTimeAsync(5000);
  Socket.instances[0]!.onmessage?.({
    data: JSON.stringify({
      type: "photo.created",
      photo: photoFixture,
      stats: { total: 1, byTribe: {} },
    }),
  });
  await vi.advanceTimersByTimeAsync(10_000);
  expect(fetch).toHaveBeenCalledTimes(1);
  resolve(Response.json({ state: "declined" }));
  await vi.advanceTimersByTimeAsync(0);
  expect(approved).toHaveBeenCalledTimes(1);
  expect(declined).toHaveBeenCalledTimes(1);
});

it("stops after a socket arrival if the in-flight status route proves unsupported", async () => {
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
  const approved = vi.fn();
  const declined = vi.fn();
  watchApproval(createRuntimeFixture().transport, "p1", approved, {
    deleteToken: "mine",
    onDeclined: declined,
  });
  await vi.advanceTimersByTimeAsync(5000);
  Socket.instances[0]!.onmessage?.({
    data: JSON.stringify({
      type: "photo.created",
      photo: photoFixture,
      stats: { total: 1, byTribe: {} },
    }),
  });
  resolve(Response.json({ error: { code: "DEMO_ROUTE_NOT_FOUND" } }, { status: 404 }));
  await vi.advanceTimersByTimeAsync(10_000);
  expect(approved).toHaveBeenCalledTimes(1);
  expect(declined).not.toHaveBeenCalled();
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(Socket.instances[0]!.close).toHaveBeenCalled();
});

it("treats PHOTO_NOT_FOUND as declined rather than unsupported", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("WebSocket", Socket);
  vi.stubGlobal("fetch", async () =>
    Response.json({ error: { code: "PHOTO_NOT_FOUND" } }, { status: 404 }),
  );
  const approved = vi.fn();
  const declined = vi.fn();
  watchApproval(createRuntimeFixture().transport, "p1", approved, {
    deleteToken: "mine",
    onDeclined: declined,
  });
  await vi.advanceTimersByTimeAsync(5000);
  expect(declined).toHaveBeenCalledTimes(1);
  expect(approved).not.toHaveBeenCalled();
});
