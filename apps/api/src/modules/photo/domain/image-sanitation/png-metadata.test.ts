import { deflateSync } from "node:zlib";

import { expect, it } from "vitest";

import { exifJpeg, imageFixture, pngChunk } from "@/testing/photo-image.fixtures";

import { sanitizeImage } from "./index";

function replaceChunk(source: Uint8Array, name: string, value: (data: Uint8Array) => Uint8Array) {
  for (let at = 8; at < source.length;) {
    const length = new DataView(source.buffer, source.byteOffset).getUint32(at);
    if (String.fromCharCode(...source.subarray(at + 4, at + 8)) === name)
      return new Uint8Array([
        ...source.subarray(0, at),
        ...pngChunk(name, value(source.subarray(at + 8, at + 8 + length))),
        ...source.subarray(at + length + 12),
      ]);
    at += length + 12;
  }
  throw new Error("Missing fixture chunk");
}
it("refuses an overexpanded or malformed retained PNG color profile", async () => {
  const b = imageFixture("profile.png");
  const profile = (data: Uint8Array) =>
    new Uint8Array([...new TextEncoder().encode("sRGB\0\0"), ...deflateSync(data)]);
  for (const data of [new Uint8Array(2 * 1024 * 1024), new Uint8Array(132)]) {
    await expect(sanitizeImage(replaceChunk(b, "iCCP", () => profile(data)))).rejects.toMatchObject(
      { code: "PHOTO_UNSUPPORTED_TYPE" },
    );
  }
});
it("retains valid animation but refuses nonsequential frame data", async () => {
  const b = imageFixture("animated.png");
  const wrong = replaceChunk(b, "fdAT", (data) => {
    const copy = data.slice();
    new DataView(copy.buffer).setUint32(0, 99);
    return copy;
  });
  await expect(sanitizeImage(wrong)).rejects.toMatchObject({ code: "PHOTO_UNSUPPORTED_TYPE" });
});
it("strips normalized PNG EXIF but refuses a fresh non-normalized orientation", async () => {
  const b = imageFixture("alpha.png"),
    at = b.length - 12;
  for (const orientation of [1, 6]) {
    const jpeg = exifJpeg(orientation),
      length = new DataView(jpeg.buffer).getUint16(4);
    const tiff = jpeg.subarray(12, 6 + length - 2);
    const extended = new Uint8Array([
      ...b.subarray(0, at),
      ...pngChunk("eXIf", tiff),
      ...b.subarray(at),
    ]);
    if (orientation === 1) expect((await sanitizeImage(extended)).bytes).toEqual(b);
    else
      await expect(sanitizeImage(extended)).rejects.toMatchObject({
        code: "PHOTO_UNSUPPORTED_TYPE",
      });
  }
});
it("bounds even a long chain of individually valid private PNG chunks", async () => {
  const b = imageFixture("alpha.png"),
    chunk = pngChunk("vpAg", new Uint8Array());
  const extra = new Uint8Array(chunk.length * 4097);
  for (let i = 0; i < 4097; i++) extra.set(chunk, i * chunk.length);
  await expect(
    sanitizeImage(
      new Uint8Array([...b.subarray(0, b.length - 12), ...extra, ...b.subarray(b.length - 12)]),
    ),
  ).rejects.toMatchObject({ code: "PHOTO_UNSUPPORTED_TYPE" });
});
