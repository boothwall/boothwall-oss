import { expect, it } from "vitest";

import { exifJpeg, imageFixture, webpChunk } from "@/testing/photo-image.fixtures";

import { sanitizeImage } from "./index";

function extendFrame(orientation: number) {
  const b = imageFixture("animated.webp");
  for (let at = 12; at < b.length;) {
    const size = new DataView(b.buffer).getUint32(at + 4, true),
      end = at + 8 + size + (size & 1);
    if (String.fromCharCode(...b.subarray(at, at + 4)) === "ANMF") {
      const jpeg = exifJpeg(orientation),
        len = new DataView(jpeg.buffer).getUint16(4);
      const data = new Uint8Array([
        ...b.subarray(at + 8, at + 8 + size),
        ...webpChunk("EXIF", jpeg.subarray(6, 6 + len - 2)),
        ...webpChunk("prIv", new TextEncoder().encode("PRIVATE_FRAME_FIXTURE")),
      ]);
      const out = new Uint8Array([
        ...b.subarray(0, at),
        ...webpChunk("ANMF", data),
        ...b.subarray(end),
      ]);
      new DataView(out.buffer).setUint32(4, out.length - 8, true);
      return out;
    }
    at = end;
  }
  throw new Error("Missing animation fixture frame");
}
it("removes private chunks inside a WebP animation frame and repairs nested lengths", async () => {
  expect((await sanitizeImage(extendFrame(1))).bytes).toEqual(imageFixture("animated.webp"));
});
it("does not hide non-normalized orientation inside an animated frame", async () => {
  await expect(sanitizeImage(extendFrame(6))).rejects.toMatchObject({
    code: "PHOTO_UNSUPPORTED_TYPE",
  });
});
