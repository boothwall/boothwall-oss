import { expect, it } from "vitest";

import { imageFixture } from "@/testing/photo-image.fixtures";

import { sanitizeImage } from "./index";

const rejected = (b: Uint8Array) =>
  expect(sanitizeImage(b)).rejects.toMatchObject({ code: "PHOTO_UNSUPPORTED_TYPE" });
const markerAt = (b: Uint8Array, marker: number) =>
  b.findIndex((value, i) => value === 255 && b[i + 1] === marker);
const segment = (marker: number, payload: number[]) =>
  new Uint8Array([255, marker, (payload.length + 2) >> 8, (payload.length + 2) & 255, ...payload]);

it.each(["all-one", "DC category", "AC magnitude", "baseline quantization"])(
  "refuses invalid JPEG %s declarations before storing a fresh image",
  async (kind) => {
    const b = imageFixture("baseline.jpg");
    if (kind === "all-one") {
      b[182] = 2;
      b[183] = 0;
    } else if (kind === "DC category") b[198] = 255;
    else if (kind === "AC magnitude") b[221] = 255;
    else {
      const at = markerAt(b, 219),
        length = (b[at + 2]! << 8) | b[at + 3]!;
      const values = Array.from(b.subarray(at + 5, at + 69)).flatMap((v) => [0, v]);
      const q16 = segment(219, [16, ...values]);
      await rejected(
        new Uint8Array([...b.subarray(0, at), ...q16, ...b.subarray(at + 2 + length)]),
      );
      return;
    }
    await rejected(b);
  },
);

it("refuses a progressive refinement scan with no initial DC values", async () => {
  const b = imageFixture("progressive.jpg"),
    at = markerAt(b, 218);
  const end = at + 2 + ((b[at + 2]! << 8) | b[at + 3]!);
  let entropyEnd = end;
  while (!(b[entropyEnd] === 255 && b[entropyEnd + 1] !== 0)) entropyEnd++;
  const refined = new Uint8Array([...b.subarray(0, entropyEnd), 255, 217]);
  refined[end - 1] = 0x10;
  await rejected(refined);
});

it("refuses a duplicate initial progressive DC scan", async () => {
  const b = imageFixture("progressive.jpg"),
    at = markerAt(b, 218);
  const end = at + 2 + ((b[at + 2]! << 8) | b[at + 3]!);
  let next = end;
  while (!(b[next] === 255 && b[next + 1] !== 0)) next++;
  await rejected(
    new Uint8Array([...b.subarray(0, next), ...b.subarray(at, next), ...b.subarray(next)]),
  );
});

it.each([0, 2])(
  "refuses Adobe transform %s contradicting a three-component JFIF",
  async (transform) => {
    const b = imageFixture("baseline.jpg");
    const adobe = segment(238, [
      ...new TextEncoder().encode("Adobe"),
      0,
      100,
      0,
      0,
      0,
      0,
      transform,
    ]);
    // Both orders are checked: compatibility cannot depend on when APP14 appears.
    await rejected(new Uint8Array([...b.subarray(0, 2), ...adobe, ...b.subarray(2)]));
    await rejected(new Uint8Array([...b.subarray(0, b.length - 2), ...adobe, 255, 217]));
  },
);

it("retains compatible Adobe YCbCr plus JFIF declarations", async () => {
  const b = imageFixture("baseline.jpg");
  const adobe = segment(238, [...new TextEncoder().encode("Adobe"), 0, 100, 0, 0, 0, 0, 1]);
  const source = new Uint8Array([...b.subarray(0, 2), ...adobe, ...b.subarray(2)]);
  expect((await sanitizeImage(source)).bytes).toEqual(source);
});

it("preserves legal same-ID table replacement and progressive sixteen-bit quantization", async () => {
  for (const name of ["baseline.jpg", "progressive.jpg"] as const) {
    const b = imageFixture(name),
      at = markerAt(b, 219);
    const length = (b[at + 2]! << 8) | b[at + 3]!;
    const original = b.subarray(at, at + 2 + length);
    const values = Array.from(b.subarray(at + 5, at + 69)).flatMap((v) => [0, v]);
    const replacement = name === "baseline.jpg" ? original : segment(219, [16, ...values]);
    const source = new Uint8Array([
      ...b.subarray(0, at),
      ...original,
      ...replacement,
      ...b.subarray(at + 2 + length),
    ]);
    expect((await sanitizeImage(source)).bytes).toEqual(source);
  }
});

it("accepts an initial progressive DC-only preview without requiring optional AC bands", async () => {
  const b = imageFixture("progressive.jpg"),
    at = markerAt(b, 218);
  const end = at + 2 + ((b[at + 2]! << 8) | b[at + 3]!);
  let next = end;
  while (!(b[next] === 255 && b[next + 1] !== 0)) next++;
  const source = new Uint8Array([...b.subarray(0, next), 255, 217]);
  expect((await sanitizeImage(source)).bytes).toEqual(source);
});
