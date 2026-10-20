import { joinBytes, le16, le24, le32, MAX_PARTS, requireImage } from "./binary";
import { checkExif } from "./exif";

export type WebpChunk = { type: string; data: Uint8Array };
export type ChunkBudget = { parts: number };
export function webpChunks(b: Uint8Array, start: number, budget: ChunkBudget) {
  const chunks: WebpChunk[] = [];
  let at = start;
  while (at < b.length) {
    requireImage(++budget.parts <= MAX_PARTS && at + 8 <= b.length);
    const size = le32(b, at + 4),
      end = at + 8 + size;
    requireImage(end + (size & 1) <= b.length && (!(size & 1) || b[end] === 0));
    const type = String.fromCharCode(...b.subarray(at, at + 4));
    requireImage(/^[\x20-\x7e]{4}$/.test(type));
    chunks.push({ type, data: b.subarray(at + 8, end) });
    at = end + (size & 1);
  }
  return chunks;
}
export function webpChunk(type: string, data: Uint8Array) {
  const out = new Uint8Array(8 + data.length + (data.length & 1));
  out.set(new TextEncoder().encode(type));
  new DataView(out.buffer).setUint32(4, data.length, true);
  out.set(data, 8);
  return out;
}
export function webpPixels(type: string, b: Uint8Array) {
  if (type === "VP8 ") {
    requireImage(
      b.length >= 10 &&
        (b[0]! & 1) === 0 &&
        ((b[0]! >> 1) & 7) <= 3 &&
        (b[0]! & 16) !== 0 &&
        b[3] === 0x9d &&
        b[4] === 1 &&
        b[5] === 0x2a &&
        (le16(b, 6) & 0xc000) === 0 &&
        (le16(b, 8) & 0xc000) === 0,
    );
    const first = le24(b, 0) >>> 5;
    requireImage(first > 0 && first <= b.length - 10);
    const width = le16(b, 6),
      height = le16(b, 8);
    requireImage(width > 0 && height > 0);
    return { width, height, alpha: false };
  }
  requireImage(type === "VP8L" && b.length >= 5 && b[0] === 47 && (b[4]! & 0xe0) === 0);
  const packed = le32(b, 1);
  return {
    width: (packed & 0x3fff) + 1,
    height: ((packed >>> 14) & 0x3fff) + 1,
    alpha: !!(packed & 0x10000000),
  };
}
export function webpFrame(chunks: WebpChunk[]) {
  const keep: Uint8Array[] = [];
  let alpha: Uint8Array | undefined, pixels: ReturnType<typeof webpPixels> | undefined;
  for (const { type, data } of chunks) {
    if (type === "ALPH") {
      requireImage(
        !alpha &&
          !pixels &&
          data.length > 1 &&
          (data[0]! & 0xc0) === 0 &&
          ((data[0]! >> 4) & 3) <= 1 &&
          (data[0]! & 3) <= 1,
      );
      alpha = data;
      keep.push(webpChunk(type, data));
    } else if (type === "VP8 " || type === "VP8L") {
      requireImage(!pixels && !(type === "VP8L" && alpha));
      pixels = webpPixels(type, data);
      if (alpha && (alpha[0]! & 3) === 0)
        requireImage(alpha.length === 1 + pixels.width * pixels.height);
      keep.push(webpChunk(type, data));
    } else if (type === "EXIF") checkExif(data);
    else requireImage(!["VP8X", "ICCP", "ANIM", "ANMF"].includes(type));
  }
  requireImage(pixels);
  return { ...pixels, alpha: !!alpha || pixels.alpha, bytes: joinBytes(keep) };
}
