import type { PhotoDTO } from "@boothwall/shared";

import { choosePick } from "./choosePick";

const photo = (id: string, extra: Partial<PhotoDTO> = {}): PhotoDTO => ({
  id,
  status: "approved",
  caption: null,
  tribe: "visiting",
  imageUrl: "x",
  thumbUrl: "x",
  createdAt: "2026-10-11T12:00:00.000Z",
  ...extra,
});

const cheered = (n: number) => ({ heart: n, fire: 0, laugh: 0, clap: 0 });

describe("choosePick", () => {
  const pool = [
    photo("quiet"),
    photo("loved", { reactions: cheered(9) }),
    photo("liked", { reactions: cheered(4) }),
    photo("pretty", { highlight: 0.9 }),
    photo("fine", { highlight: 0.4 }),
  ];

  it("takes turns between the crowd's favourite and the AI's pick, skipping recent ones", () => {
    expect(choosePick(pool, [], null)).toMatchObject({ kind: "crowd", reactions: 9 });
    expect(choosePick(pool, [], "crowd")?.photo.id).toBe("pretty");
    expect(choosePick(pool, ["loved"], "ai")?.photo.id).toBe("liked");
    expect(choosePick(pool, ["loved", "liked"], "ai")?.photo.id).toBe("pretty");
    expect(choosePick([photo("quiet"), photo("fine", { highlight: 0.4 })], [], null)).toBeNull();
  });
});
