import { readFileSync } from "node:fs";
import { URL } from "node:url";

export function imageFixture(
  name:
    | "baseline.jpg"
    | "progressive.jpg"
    | "alpha.png"
    | "alpha.webp"
    | "cmyk.jpg"
    | "profile.jpg"
    | "animated.webp"
    | "animated.png"
    | "profile.png",
) {
  return new Uint8Array(readFileSync(new URL(`./image-fixtures/${name}`, import.meta.url)));
}

/** Valid TIFF orientation in an EXIF APP1, with a private marker to catch leaks. */
export function exifJpeg(orientation = 1) {
  const tiff = [
    0x49,
    0x49,
    42,
    0,
    8,
    0,
    0,
    0,
    1,
    0,
    0x12,
    1,
    3,
    0,
    1,
    0,
    0,
    0,
    orientation,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
  ];
  const payload = new Uint8Array([
    ...new TextEncoder().encode("Exif\0\0"),
    ...tiff,
    ...new TextEncoder().encode("GPS_PRIVATE_FIXTURE"),
  ]);
  const source = imageFixture("baseline.jpg"),
    length = payload.length + 2;
  return new Uint8Array([
    0xff,
    0xd8,
    0xff,
    0xe1,
    length >> 8,
    length & 255,
    ...payload,
    ...source.subarray(2),
  ]);
}

export function imageFile(bytes: Uint8Array, type = "image/jpeg") {
  return new File([bytes as Uint8Array<ArrayBuffer>], "fixture", { type });
}

export function pngChunk(type: string, data: Uint8Array) {
  const b = new Uint8Array(12 + data.length),
    d = new DataView(b.buffer);
  d.setUint32(0, data.length);
  b.set(new TextEncoder().encode(type), 4);
  b.set(data, 8);
  let crc = 0xffffffff;
  for (const v of b.subarray(4, b.length - 4)) {
    crc ^= v;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  d.setUint32(b.length - 4, (crc ^ 0xffffffff) >>> 0);
  return b;
}

export function privatePng() {
  const source = imageFixture("alpha.png"),
    insert = source.length - 12;
  return new Uint8Array([
    ...source.subarray(0, insert),
    ...pngChunk("tEXt", new TextEncoder().encode("Author\0GPS_PRIVATE_FIXTURE")),
    ...source.subarray(insert),
  ]);
}

export function webpChunk(type: string, data: Uint8Array) {
  const b = new Uint8Array(8 + data.length + (data.length & 1));
  b.set(new TextEncoder().encode(type));
  new DataView(b.buffer).setUint32(4, data.length, true);
  b.set(data, 8);
  return b;
}

export function privateWebp(orientation = 1) {
  const source = imageFixture("alpha.webp"),
    exif = exifJpeg(orientation),
    payload = exif.subarray(6, 6 + new DataView(exif.buffer).getUint16(4) - 2);
  const b = new Uint8Array([...source, ...webpChunk("EXIF", payload)]);
  new DataView(b.buffer).setUint32(4, b.length - 8, true);
  b[20] = b[20]! | 8;
  return b;
}

/** Real decodable baseline by default; explicit dimensions patch only the test header. */
export const jpeg = (width = 16, height = 12) => {
  const bytes = imageFixture("baseline.jpg");
  for (let at = 2; at + 9 < bytes.length;) {
    const marker = bytes[at + 1]!;
    if (marker === 0xc0) {
      bytes[at + 5] = height >> 8;
      bytes[at + 6] = height & 255;
      bytes[at + 7] = width >> 8;
      bytes[at + 8] = width & 255;
      break;
    }
    at += 2 + ((bytes[at + 2]! << 8) | bytes[at + 3]!);
  }
  return new File([bytes as Uint8Array<ArrayBuffer>], "me.jpg", { type: "image/jpeg" });
};
