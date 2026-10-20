import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("cloudflare:workers", () => ({
  DurableObject: class {
    constructor(
      readonly ctx: unknown,
      readonly env: unknown,
    ) {}
  },
}));

const { REACTION_BATCH_MS, WallRoom } = await import("./wall.room");

const counts = (heart: number) => ({ heart, fire: 0, laugh: 0, clap: 0 });

const makeRoom = () => {
  const socket = { send: vi.fn() };
  const setAlarm = vi.fn().mockResolvedValue(undefined);
  const ctx = {
    setWebSocketAutoResponse: vi.fn(),
    getWebSockets: () => [socket],
    storage: { setAlarm },
  };
  const room = new WallRoom(ctx as never, {} as never);
  return { room, socket, setAlarm };
};

beforeEach(() => {
  vi.stubGlobal("WebSocketRequestResponsePair", class {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WallRoom reactions", () => {
  it("coalesces a burst of taps into one photo.reactions broadcast", async () => {
    const { room, socket, setAlarm } = makeRoom();

    await room.queueReactions("p1", counts(1));
    await room.queueReactions("p1", counts(2));
    await room.queueReactions("p1", counts(3));

    expect(setAlarm).toHaveBeenCalledTimes(1);
    expect(setAlarm.mock.calls[0]?.[0]).toBeGreaterThanOrEqual(Date.now() + REACTION_BATCH_MS - 50);
    expect(socket.send).not.toHaveBeenCalled();

    room.alarm();
    expect(socket.send).toHaveBeenCalledTimes(1);
    expect(JSON.parse(socket.send.mock.calls[0]?.[0] as string)).toEqual({
      type: "photo.reactions",
      photoId: "p1",
      counts: counts(3),
    });

    // Nothing new: the next alarm stays quiet, and the next tap starts a new batch.
    room.alarm();
    expect(socket.send).toHaveBeenCalledTimes(1);
    await room.queueReactions("p1", counts(4));
    expect(setAlarm).toHaveBeenCalledTimes(2);
  });

  it("limits taps per client", () => {
    const { room } = makeRoom();
    expect(room.allowReaction()).toBe(false);
    expect(room.allowClientReaction(`hmac-v1:${"a".repeat(64)}`, 1, 60_000, "b".repeat(64))).toBe(
      true,
    );
    expect(room.allowClientReaction(`hmac-v1:${"a".repeat(64)}`, 1, 60_000, "b".repeat(64))).toBe(
      false,
    );
  });
});

it("persists room deletion, closes sockets and rejects reconnects", async () => {
  const socket = { close: vi.fn(), send: vi.fn() };
  const storage = new Map<string, unknown>();
  const ctx = {
    setWebSocketAutoResponse: vi.fn(),
    getWebSockets: () => [socket],
    blockConcurrencyWhile: <T>(callback: () => Promise<T>) => callback(),
    storage: {
      get: async (key: string) => storage.get(key),
      put: async (key: string, value: unknown) => {
        storage.set(key, value);
      },
    },
  };
  const room = new WallRoom(ctx as never, {} as never);
  await room.invalidate(true);
  expect(socket.send).toHaveBeenCalledWith(
    JSON.stringify({ type: "wall.access-changed", permanent: true }),
  );
  expect(socket.close).toHaveBeenCalledWith(1008, "Wall access changed");
  const rehydrated = new WallRoom(ctx as never, {} as never);
  expect((await rehydrated.fetch(new Request("https://room/screen"))).status).toBe(410);
});
