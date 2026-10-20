import { expect, it } from "vitest";

import {
  exifJpeg,
  imageFixture,
  pngChunk,
  privatePng,
  privateWebp,
  webpChunk,
} from "@/testing/photo-image.fixtures";

import { sanitizeImage } from "./index";

it.each([
  "baseline.jpg",
  "progressive.jpg",
  "alpha.png",
  "alpha.webp",
  "cmyk.jpg",
  "profile.jpg",
  "animated.webp",
  "animated.png",
  "profile.png",
] as const)("preserves a real small decodable %s and is deterministic", async (name) => {
  const original = imageFixture(name),
    first = await sanitizeImage(original);
  expect(first).toMatchObject({ width: 16, height: 12 });
  expect(first.bytes).toEqual(original);
  expect((await sanitizeImage(first.bytes)).bytes).toEqual(first.bytes);
});
it.each([0, 2, 6, 8])(
  "refuses fresh JPEG orientation %s instead of silently rotating pixels",
  async (n) => {
    await expect(sanitizeImage(exifJpeg(n))).rejects.toMatchObject({
      code: "PHOTO_UNSUPPORTED_TYPE",
    });
  },
);
it("refuses truncated/concatenated JPEGs rather than treating a header as a valid container", async () => {
  const b = imageFixture("baseline.jpg");
  for (const source of [b.subarray(0, b.length - 2), new Uint8Array([...b, ...b])])
    await expect(sanitizeImage(source)).rejects.toMatchObject({ code: "PHOTO_UNSUPPORTED_TYPE" });
});
it("checks PNG CRC even for private chunks before discarding them", async () => {
  const b = privatePng();
  b[b.length - 15] = b[b.length - 15]! ^ 1;
  await expect(sanitizeImage(b)).rejects.toMatchObject({ code: "PHOTO_UNSUPPORTED_TYPE" });
});
it("refuses an unknown critical PNG structure but discards unknown ancillary data", async () => {
  const b = imageFixture("alpha.png"),
    insert = b.length - 12;
  const add = (name: string) =>
    new Uint8Array([
      ...b.subarray(0, insert),
      ...pngChunk(name, new Uint8Array([7])),
      ...b.subarray(insert),
    ]);
  await expect(sanitizeImage(add("ABCD"))).rejects.toMatchObject({
    code: "PHOTO_UNSUPPORTED_TYPE",
  });
  expect((await sanitizeImage(add("vpAg"))).bytes).toEqual(b);
});
it("refuses PNG trailing data and wrong dimensions/critical ordering", async () => {
  const b = imageFixture("alpha.png"),
    zero = b.slice();
  const header = zero.slice(16, 29);
  header.fill(0, 0, 4);
  zero.set(pngChunk("IHDR", header), 8);
  for (const source of [new Uint8Array([...b, 0]), zero])
    await expect(sanitizeImage(source)).rejects.toMatchObject({ code: "PHOTO_UNSUPPORTED_TYPE" });
});
it("updates WebP metadata flags and RIFF length when stripping EXIF and private chunks", async () => {
  const original = imageFixture("alpha.webp"),
    b = privateWebp();
  const extended = new Uint8Array([...b, ...webpChunk("prIv", new Uint8Array([1, 2, 3]))]);
  new DataView(extended.buffer).setUint32(4, extended.length - 8, true);
  expect((await sanitizeImage(extended)).bytes).toEqual(original);
});
it("refuses WebP length, odd-padding, feature-flag and canvas inconsistencies", async () => {
  const original = imageFixture("alpha.webp");
  const length = original.slice();
  length[4] = length[4]! + 1;
  const flags = original.slice();
  flags[20] = flags[20]! | 32;
  const canvas = original.slice();
  canvas[24] = canvas[24]! + 1;
  const padding = new Uint8Array([...original, ...webpChunk("prIv", new Uint8Array([7]))]);
  new DataView(padding.buffer).setUint32(4, padding.length - 8, true);
  padding[padding.length - 1] = 9;
  for (const source of [length, flags, canvas, padding])
    await expect(sanitizeImage(source)).rejects.toMatchObject({ code: "PHOTO_UNSUPPORTED_TYPE" });
});

it("refuses a JPEG that reaches EOI without ever scanning every frame component", async () => {
  const b = imageFixture("baseline.jpg");
  const at = b.findIndex((v, i) => v === 255 && b[i + 1] === 218);
  const length = (b[at + 2]! << 8) | b[at + 3]!;
  const partial = new Uint8Array([
    ...b.subarray(0, at),
    255,
    218,
    0,
    8,
    1,
    b[at + 5]!,
    b[at + 6]!,
    0,
    63,
    0,
    ...b.subarray(at + 2 + length),
  ]);
  await expect(sanitizeImage(partial)).rejects.toMatchObject({ code: "PHOTO_UNSUPPORTED_TYPE" });
});
