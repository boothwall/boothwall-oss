import { DEFAULT_SETTINGS, type PhotoDTO } from "@boothwall/shared";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { PhotoReview } from "./PhotoReview";

afterEach(() => vi.useRealTimers());

/** A guest's harmless thumbnail over a different original: only the original may be judged. */
const swapped: PhotoDTO = {
  id: "00000000-0000-4000-8000-000000000001",
  status: "pending",
  caption: "Photo 1",
  tribe: "fire-tv",
  imageUrl: "https://api.test/photos/p1/image",
  thumbUrl: "https://api.test/photos/p1/harmless-thumb",
  createdAt: "2026-10-07T12:00:00.000Z",
};

function mount() {
  const act = vi.fn(async () => true);
  const photos = {
    loaded: true,
    pending: [swapped],
    approved: [],
    busy: null,
    cursor: null,
    act,
    more: vi.fn(),
  } as unknown as Parameters<typeof PhotoReview>[0]["photos"];
  render(
    <PhotoReview
      photos={photos}
      categories={DEFAULT_SETTINGS.categories}
      view="pending"
      onViewChange={vi.fn()}
      onWall={null}
    />,
  );
  const approve = () => screen.getByRole<HTMLButtonElement>("button", { name: "Approve" });
  const shown = () => [...document.querySelectorAll("img")].map((image) => image.src);
  return { act, approve, shown };
}

it("judges the original, never the guest's thumbnail, and approves only once it has loaded", () => {
  const { act: decide, approve, shown } = mount();
  expect(shown()).toEqual([swapped.imageUrl]);
  expect(approve().disabled).toBe(true);
  expect(screen.getByText("Approve turns on once the full photo has loaded.")).toBeTruthy();
  fireEvent.load(screen.getByAltText("Photo 1"));
  expect(approve().disabled).toBe(false);
  fireEvent.click(approve());
  expect(decide).toHaveBeenCalledWith(swapped, "approve");
});

it("keeps Approve off with no thumbnail fallback when the original fails, until a retry loads", () => {
  vi.useFakeTimers();
  const { approve, shown } = mount();
  fireEvent.error(screen.getByAltText("Photo 1"));
  act(() => vi.advanceTimersByTime(2500));
  fireEvent.error(screen.getByAltText("Photo 1"));
  expect(screen.getByRole("alert").textContent).toMatch(/didn't load/);
  expect(approve().disabled).toBe(true);
  expect(shown()).not.toContain(swapped.thumbUrl);
  expect(screen.getByRole("button", { name: "Reject" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(approve().disabled).toBe(true);
  fireEvent.load(screen.getByAltText("Photo 1"));
  expect(approve().disabled).toBe(false);
});
