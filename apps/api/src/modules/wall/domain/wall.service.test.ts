import { DEFAULT_WALL_ID } from "@boothwall/shared";
import { describe, expect, it, vi } from "vitest";

import type { WallRoom } from "@/modules/wall/realtime/wall.room";

import { roomName, wallService } from "./wall.service";

const fakeNamespace = () => {
  const stub = {
    broadcast: vi.fn().mockResolvedValue(1),
    allowClientReaction: vi.fn().mockResolvedValue(true),
    queueReactions: vi.fn().mockResolvedValue(undefined),
  };
  const namespace = {
    idFromName: vi.fn((name: string) => `id:${name}`),
    get: vi.fn(() => stub),
  };
  return { namespace, stub, typed: namespace as unknown as DurableObjectNamespace<WallRoom> };
};

describe("roomName", () => {
  it("keeps the original room for the default wall", () => {
    expect(roomName(DEFAULT_WALL_ID)).toBe("main");
  });

  it("gives every other wall its own room", () => {
    expect(roomName("acme")).toBe("wall:acme");
  });
});

describe("wallService", () => {
  it("broadcasts to the default wall's room", async () => {
    const { namespace, stub, typed } = fakeNamespace();
    await wallService.broadcaster(typed, DEFAULT_WALL_ID).broadcast({
      type: "remote.command",
      command: "left",
    });
    expect(namespace.idFromName).toHaveBeenCalledWith("main");
    expect(namespace.get).toHaveBeenCalledWith("id:main");
    expect(stub.broadcast).toHaveBeenCalledWith('{"type":"remote.command","command":"left"}');
  });

  it("sends reactions to the room of the wall they're for", async () => {
    const { namespace, stub, typed } = fakeNamespace();
    const counts = { heart: 1, fire: 0, laugh: 0, clap: 0 };
    const room = wallService.reactions(typed, "acme");
    await room.allow({ current: "hash", legacy: "prior" }, { max: 5, windowMs: 1000 });
    await room.queue("p1", counts);
    expect(namespace.idFromName).toHaveBeenCalledWith("wall:acme");
    expect(stub.allowClientReaction).toHaveBeenCalledWith("hash", 5, 1000, "prior");
    expect(stub.queueReactions).toHaveBeenCalledWith("p1", counts);
  });
});
