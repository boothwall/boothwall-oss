import { wallMetadata } from "./mediaMetadata";

it("describes the event as the media playing", () => {
  const id = { contentId: "wall" } as unknown as Parameters<typeof wallMetadata>[0];
  expect(wallMetadata(id, { name: "Acme DevDays 2026", hashtag: "#AcmeDevDays" })).toEqual({
    mediaId: id,
    title: "Acme DevDays 2026",
    description: "#AcmeDevDays",
    artwork: [],
  });
});
