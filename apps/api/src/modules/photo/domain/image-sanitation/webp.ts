import { ascii, checkIcc, joinBytes, le24, le32, requireImage } from "./binary";
import { checkExif } from "./exif";
import { type WebpChunk, webpChunk, webpChunks, webpFrame } from "./webp-chunks";

export function sanitizeWebp(b: Uint8Array) {
  requireImage(
    b.length >= 20 && ascii(b, 0, "RIFF") && ascii(b, 8, "WEBP") && le32(b, 4) === b.length - 8,
  );
  const budget = { parts: 0 },
    chunks = webpChunks(b, 12, budget),
    parts: Uint8Array[] = [];
  const still: WebpChunk[] = [];
  let width = 0,
    height = 0,
    flags = 0,
    extended = false,
    animation = false,
    frames = 0;
  let hasIcc = false,
    hasExif = false,
    hasXmp = false,
    alpha = false,
    dataStarted = false;
  for (let i = 0; i < chunks.length; i++) {
    const { type, data } = chunks[i]!;
    if (type === "VP8X") {
      requireImage(
        i === 0 &&
          data.length === 10 &&
          (data[0]! & 0xc1) === 0 &&
          data[1] === 0 &&
          data[2] === 0 &&
          data[3] === 0,
      );
      extended = true;
      flags = data[0]!;
      width = le24(data, 4) + 1;
      height = le24(data, 7) + 1;
      requireImage(width * height <= 0xffffffff);
      const header = data.slice();
      header[0] = flags & ~12;
      parts.push(webpChunk(type, header));
    } else if (type === "ICCP") {
      requireImage(extended && !hasIcc && !animation && !dataStarted);
      checkIcc(data);
      hasIcc = true;
      parts.push(webpChunk(type, data));
    } else if (type === "ANIM") {
      requireImage(extended && flags & 2 && !animation && !dataStarted && data.length === 6);
      animation = true;
      parts.push(webpChunk(type, data));
    } else if (type === "ANMF") {
      requireImage(animation && data.length >= 16 && (data[15]! & 0xfc) === 0);
      const x = le24(data, 0) * 2,
        y = le24(data, 3) * 2,
        w = le24(data, 6) + 1,
        h = le24(data, 9) + 1;
      requireImage(x + w <= width && y + h <= height);
      const frame = webpFrame(webpChunks(data, 16, budget));
      requireImage(frame.width === w && frame.height === h);
      alpha ||= frame.alpha;
      frames++;
      dataStarted = true;
      parts.push(webpChunk(type, joinBytes([data.subarray(0, 16), frame.bytes])));
    } else if (type === "EXIF") {
      requireImage(extended && !hasExif);
      checkExif(data);
      hasExif = true;
    } else if (type === "XMP ") {
      requireImage(extended && !hasXmp);
      hasXmp = true;
    } else if (["VP8 ", "VP8L", "ALPH"].includes(type)) {
      requireImage(!animation && !(flags & 2));
      still.push({ type, data });
      dataStarted = true;
    }
    // Every unrecognized/private chunk is discarded, including inside animation frames.
  }
  if (animation) requireImage(frames > 0 && !still.length);
  else {
    requireImage(!(flags & 2));
    const frame = webpFrame(still);
    if (extended) requireImage(width === frame.width && height === frame.height);
    else {
      width = frame.width;
      height = frame.height;
    }
    alpha = frame.alpha;
    parts.push(frame.bytes);
  }
  if (extended)
    requireImage(
      !!(flags & 32) === hasIcc &&
        !!(flags & 8) === hasExif &&
        !!(flags & 4) === hasXmp &&
        !!(flags & 16) === alpha &&
        !!(flags & 2) === animation,
    );
  else requireImage(!hasIcc && !hasExif && !hasXmp && !animation && still.length === 1);
  const out = joinBytes([b.subarray(0, 12), ...parts]);
  new DataView(out.buffer).setUint32(4, out.length - 8, true);
  return { bytes: out, width, height };
}
