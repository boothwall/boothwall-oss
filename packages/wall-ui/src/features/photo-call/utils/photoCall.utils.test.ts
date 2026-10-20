import { formatCountdown, missionFor, readableUrl } from "./photoCall.utils";

const categories = [
  { id: "speaker", label: "Selfie with a speaker" },
  { id: "booth", label: "Best booth find" },
  { id: "visiting", label: "Just visiting", catchAll: true },
];

it("formats the countdown in whole seconds, never below zero", () => {
  expect([60, 59.2, 9, 0.4, -3].map(formatCountdown)).toEqual([
    "1:00",
    "1:00",
    "0:09",
    "0:01",
    "0:00",
  ]);
});

it("rotates through the named categories as missions", () => {
  expect([0, 1, 2].map((index) => missionFor(categories, index))).toEqual([
    "Selfie with a speaker",
    "Best booth find",
    "Selfie with a speaker",
  ]);
  expect(missionFor([{ id: "all", label: "All", catchAll: true }], 0)).toBeNull();
});

it("drops the scheme from the join address", () => {
  expect(readableUrl("https://wall.example.com/snap")).toBe("wall.example.com/snap");
});
