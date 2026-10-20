import { describe, expect, it } from "vitest";

import {
  catchAllOf,
  categoriesSchema,
  categoryName,
  printedCategory,
} from "./categories.schemas.ts";

const categories = [
  { id: "fire-tv", label: "Fire TV apps" },
  { id: "visiting", label: "Just visiting", catchAll: true },
];

describe("categories", () => {
  it("needs unique ids, at most one catch-all and at least one category", () => {
    expect(categoriesSchema.safeParse(categories).success).toBe(true);
    expect(categoriesSchema.safeParse([...categories, categories[0]]).success).toBe(false);
    expect(
      categoriesSchema.safeParse([...categories, { id: "b", label: "B", catchAll: true }]).success,
    ).toBe(false);
    expect(categoriesSchema.safeParse([]).success).toBe(false);
  });

  it("prints nothing for the catch-all or a removed category, but still names them", () => {
    expect(printedCategory(categories, "fire-tv")).toBe("Fire TV apps");
    expect(printedCategory(categories, "visiting")).toBeNull();
    expect(printedCategory(categories, "gone")).toBeNull();
    expect(categoryName(categories, "visiting")).toBe("Just visiting");
    expect(categoryName(categories, "gone")).toBe("gone");
    expect(catchAllOf(categories)).toBe("visiting");
  });
});
