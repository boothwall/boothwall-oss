import type { Category, PhotoDTO } from "@boothwall/shared";

import { rankCrowd } from "./whoIsHere";

const categories: Category[] = [
  { id: "team", label: "On the team" },
  { id: "first", label: "First time here" },
  { id: "regular", label: "Regulars" },
  { id: "family", label: "Friends & family" },
  { id: "fun", label: "Just visiting", catchAll: true },
];
const photo = (id: string, tribe: string, minute: number) =>
  ({
    id,
    tribe,
    createdAt: `2026-10-11T10:${String(minute).padStart(2, "0")}:00.000Z`,
  }) as PhotoDTO;

describe("rankCrowd", () => {
  it("ranks categories with photos, keeps the catch-all last, caps rows and stacks newest photos", () => {
    const stats = { total: 14, byTribe: { team: 2, first: 5, regular: 1, family: 3, fun: 9 } };
    const pool = [
      photo("a", "first", 1),
      photo("b", "first", 5),
      photo("c", "team", 2),
      photo("d", "first", 3),
    ];
    const { rows, more } = rankCrowd(categories, stats, pool, { maxRows: 4, thumbs: 2 });
    expect(rows.map((row) => row.id)).toEqual(["first", "family", "team", "regular"]);
    expect(more).toBe(1);
    expect(rows[0]!.photos.map((p) => p.id)).toEqual(["b", "d"]);
    expect(rows.some((row) => row.neutral)).toBe(false);
  });
});
