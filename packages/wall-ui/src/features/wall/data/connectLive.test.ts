import { DEFAULT_SETTINGS } from "@boothwall/shared";

import { connectLive } from "./connectLive";
class Socket {
  static instances: Socket[] = [];
  static OPEN = 1;
  readyState = 0;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  close = jest.fn();
  send = jest.fn();
  constructor(readonly url: string) {
    Socket.instances.push(this);
  }
}
const originalSocket = globalThis.WebSocket;
afterEach(() => {
  globalThis.WebSocket = originalSocket;
  jest.restoreAllMocks();
  jest.useRealTimers();
  Socket.instances = [];
});
it("scopes HTTP and socket to the injected endpoint and stops reconnecting on revoked access", async () => {
  jest.useFakeTimers();
  globalThis.WebSocket = Socket as unknown as typeof WebSocket;
  const fetcher = jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValue({ ok: false, status: 410 } as Response);
  const revoked = jest.fn();
  const stop = connectLive({
    apiBaseUrl: "https://other-api.test",
    target: { wallId: "event-a", screenToken: "screen-a" },
    photos: true,
    dispatch: jest.fn(),
    setStatus: jest.fn(),
    onLoaded: jest.fn(),
    onFailure: jest.fn(),
    onRemote: jest.fn(),
    onAccessRevoked: revoked,
  });
  expect(Socket.instances[0]?.url).toBe(
    "wss://other-api.test/wall/live?wall=event-a&screen=screen-a",
  );
  jest.advanceTimersByTime(1500);
  for (let i = 0; i < 10; i++) await Promise.resolve();
  expect(fetcher.mock.calls[0]?.[0]).toBe(
    "https://other-api.test/photos?limit=80&wall=event-a&screen=screen-a",
  );
  expect(revoked).toHaveBeenCalledTimes(1);
  expect(Socket.instances[0]?.close).toHaveBeenCalled();
  jest.advanceTimersByTime(120000);
  expect(Socket.instances).toHaveLength(1);
  expect(fetcher).toHaveBeenCalledTimes(1);
  stop();
});
it("revokes the display immediately without waiting for a close handshake", () => {
  jest.useFakeTimers();
  globalThis.WebSocket = Socket as unknown as typeof WebSocket;
  const revoked = jest.fn();
  const stop = connectLive({
    target: { wallId: "a" },
    photos: true,
    dispatch: jest.fn(),
    setStatus: jest.fn(),
    onLoaded: jest.fn(),
    onFailure: jest.fn(),
    onRemote: jest.fn(),
    onAccessRevoked: revoked,
  });
  const socket = Socket.instances[0]!;
  socket.onmessage?.({ data: JSON.stringify({ type: "wall.access-changed", permanent: true }) });
  expect(revoked).toHaveBeenCalledTimes(1);
  expect(socket.close).toHaveBeenCalled();
  jest.advanceTimersByTime(120000);
  expect(Socket.instances).toHaveLength(1);
  stop();
});

it("refreshes the current snapshot after a temporary room reset without revoking display access", async () => {
  jest.useFakeTimers();
  globalThis.WebSocket = Socket as unknown as typeof WebSocket;
  const snapshot = { photos: [], stats: { total: 0, byTribe: {} }, settings: DEFAULT_SETTINGS };
  const fetcher = jest.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => snapshot,
  } as Response);
  const dispatch = jest.fn(),
    revoked = jest.fn(),
    loaded = jest.fn();
  const stop = connectLive({
    apiBaseUrl: "https://display-api.test",
    target: { wallId: "event-a", screenToken: "screen-a" },
    photos: true,
    dispatch,
    setStatus: jest.fn(),
    onLoaded: loaded,
    onFailure: jest.fn(),
    onRemote: jest.fn(),
    onAccessRevoked: revoked,
  });
  const socket = Socket.instances[0]!;
  socket.onmessage?.({ data: JSON.stringify({ type: "wall.access-changed", permanent: false }) });
  for (let i = 0; i < 20; i++) await Promise.resolve();
  expect(socket.close).toHaveBeenCalled();
  expect(fetcher).toHaveBeenCalledWith(
    "https://display-api.test/photos?limit=80&wall=event-a&screen=screen-a",
    expect.any(Object),
  );
  expect(dispatch).toHaveBeenCalledWith({ type: "snapshot", snapshot });
  expect(loaded).toHaveBeenCalledTimes(1);
  expect(revoked).not.toHaveBeenCalled();
  stop();
});
