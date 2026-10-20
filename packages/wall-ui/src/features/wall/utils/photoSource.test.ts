import { PHOTO_LIMITS } from "@boothwall/shared";

import { photoSource } from "./photoSource";

const photo = { imageUrl: "full.jpg", thumbUrl: "thumb.jpg" };

describe("photoSource", () => {
  it("keeps the thumbnail while it has the pixels, at the TV's and a Retina window's density", () => {
    expect(photoSource(photo, PHOTO_LIMITS.thumbEdgePx / 2, 2)).toBe("thumb.jpg");
    expect(photoSource(photo, 100, 3)).toBe("thumb.jpg");
  });

  it("switches to the original once the thumbnail would be stretched", () => {
    expect(photoSource(photo, PHOTO_LIMITS.thumbEdgePx / 2 + 1, 2)).toBe("full.jpg");
    expect(photoSource(photo, 100, 6)).toBe("full.jpg");
  });
});
