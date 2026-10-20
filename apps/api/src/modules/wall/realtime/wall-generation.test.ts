import { afterEach, beforeEach, expect, it, vi } from "vitest";

vi.mock("cloudflare:workers", () => ({
  DurableObject: class {
    constructor(
      readonly ctx: unknown,
      readonly env: unknown,
    ) {}
  },
}));
const { WallRoom } = await import("./wall.room");
const ResponseClass = Response;
beforeEach(() => {
  vi.stubGlobal("WebSocketRequestResponsePair", class {});
  vi.stubGlobal(
    "WebSocketPair",
    class {
      0 = {};
      1 = { send: vi.fn(), close: vi.fn() };
    },
  );
  vi.stubGlobal(
    "Response",
    class extends ResponseClass {
      constructor(body: BodyInit | null, init: ResponseInit) {
        super(body, { ...init, status: init.status === 101 ? 200 : init.status });
        Object.defineProperty(this, "status", { value: init.status });
      }
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

const fixture = () => {
  const storage = new Map<string, unknown>();
  const sockets: { send: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn> }[] = [];
  let tail: Promise<unknown> = Promise.resolve();
  const ctx = {
    setWebSocketAutoResponse: vi.fn(),
    getWebSockets: () => sockets,
    acceptWebSocket: (socket: (typeof sockets)[number]) => sockets.push(socket),
    blockConcurrencyWhile: <T>(callback: () => Promise<T>) => {
      const next = tail.then(callback);
      tail = next.catch(() => {});
      return next;
    },
    storage: {
      get: async (key: string) => storage.get(key),
      put: async (key: string, value: unknown) => {
        storage.set(key, value);
      },
    },
  };
  return { ctx, sockets, room: new WallRoom(ctx as never, {} as never) };
};
const request = (generation?: number) =>
  new Request(`https://room/screen${generation === undefined ? "" : `?generation=${generation}`}`);

it("rejects upgrades authorized before invalidation, including after hibernation", async () => {
  const { room, ctx, sockets } = fixture();
  await room.invalidate(false, 2);
  expect((await room.fetch(request(1))).status).toBe(410);
  expect(sockets).toHaveLength(0);
  expect((await room.fetch(request(2))).status).toBe(101);
  await room.invalidate(false, 1);
  expect(sockets[0]!.close).not.toHaveBeenCalled();
  const rehydrated = new WallRoom(ctx as never, {} as never);
  expect((await rehydrated.fetch(request(1))).status).toBe(410);
  expect((await rehydrated.fetch(request())).status).toBe(410);
});

it("serializes a suspended upgrade against invalidation so it cannot miss revocation", async () => {
  const { room, ctx, sockets } = fixture();
  let entered!: () => void;
  let resume!: () => void;
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const hold = new Promise<void>((resolve) => {
    resume = resolve;
  });
  const get = ctx.storage.get;
  vi.spyOn(ctx.storage, "get").mockImplementationOnce(async (key) => {
    entered();
    await hold;
    return get(key);
  });
  const upgrade = room.fetch(request(1));
  await started;
  const invalidate = room.invalidate(false, 2);
  resume();
  expect((await upgrade).status).toBe(101);
  await invalidate;
  expect(sockets[0]!.close).toHaveBeenCalledWith(1008, "Wall access changed");
  expect(sockets[0]!.send).toHaveBeenCalledWith(
    JSON.stringify({ type: "wall.access-changed", permanent: false }),
  );
});

it("keeps standalone rooms compatible without a host generation", async () => {
  const { room } = fixture();
  expect((await room.fetch(request())).status).toBe(101);
});
