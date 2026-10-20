import { be32, joinBytes, MAX_PARTS, requireImage } from "./binary";
import { crc32 } from "./crc";
import { checkExif } from "./exif";
import { PngAnimation } from "./png-animation";
import { pngColor } from "./png-color";

const EARLY_COLOR = new Set(["gAMA", "cHRM", "sRGB", "iCCP", "sBIT", "cICP", "mDCV", "cLLI"]);
const RENDER = new Set([...EARLY_COLOR, "tRNS", "bKGD", "hIST", "pHYs"]);
export async function sanitizePng(b: Uint8Array) {
  const parts = [b.subarray(0, 8)],
    seen = new Set<string>();
  let at = 8,
    count = 0,
    width = 0,
    height = 0,
    color = -1,
    depth = 0;
  let palette = 0,
    imageBytes = 0,
    imageStarted = false,
    imageEnded = false;
  let animation: PngAnimation | undefined;
  while (at < b.length) {
    requireImage(++count <= MAX_PARTS && at + 12 <= b.length);
    const length = be32(b, at),
      end = at + 12 + length;
    requireImage(length <= 0x7fffffff && end <= b.length);
    const type = String.fromCharCode(...b.subarray(at + 4, at + 8));
    requireImage(
      /^[A-Za-z]{2}[A-Z][A-Za-z]$/.test(type) &&
        crc32(b.subarray(at + 4, end - 4)) === be32(b, end - 4),
    );
    const data = b.subarray(at + 8, end - 4);
    requireImage(count === 1 ? type === "IHDR" : type !== "IHDR");
    if (imageStarted && type !== "IDAT") imageEnded = true;
    let keep = true;
    if (type === "IHDR") {
      requireImage(length === 13);
      width = be32(data, 0);
      height = be32(data, 4);
      depth = data[8]!;
      color = data[9]!;
      const depths = (
        { 0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16] } as Record<
          number,
          number[]
        >
      )[color];
      requireImage(
        width > 0 &&
          height > 0 &&
          width <= 0x7fffffff &&
          height <= 0x7fffffff &&
          depths?.includes(depth) &&
          data[10] === 0 &&
          data[11] === 0 &&
          data[12]! <= 1,
      );
      animation = new PngAnimation(width, height);
    } else if (type === "PLTE") {
      requireImage(
        !seen.has(type) &&
          !imageStarted &&
          ![0, 4].includes(color) &&
          length > 0 &&
          length % 3 === 0 &&
          length <= 768,
      );
      palette = length / 3;
      requireImage(color !== 3 || palette <= 2 ** depth);
    } else if (type === "IDAT") {
      requireImage(!imageEnded && (color !== 3 || palette > 0));
      imageStarted = true;
      imageBytes += length;
      animation!.imageData(length);
    } else if (type === "IEND") {
      requireImage(length === 0 && imageStarted && imageBytes > 0 && end === b.length);
      animation!.finish();
      parts.push(b.subarray(at, end));
      return { bytes: joinBytes(parts), width, height };
    } else if (type === "acTL") animation!.control(data, imageStarted);
    else if (type === "fcTL") animation!.frame(data, imageStarted);
    else if (type === "fdAT") animation!.frameData(data, imageStarted);
    else if (type === "eXIf") {
      requireImage(!seen.has(type));
      checkExif(data);
      keep = false;
    } else if (RENDER.has(type)) {
      requireImage(!seen.has(type) && !imageStarted && (!EARLY_COLOR.has(type) || !palette));
      requireImage(
        !((type === "sRGB" && seen.has("iCCP")) || (type === "iCCP" && seen.has("sRGB"))),
      );
      await pngColor(type, data, color, depth, palette);
    } else {
      requireImage((type.charCodeAt(0) & 32) !== 0);
      keep = false;
    }
    if (keep) parts.push(b.subarray(at, end));
    seen.add(type);
    at = end;
  }
  requireImage(false);
  throw new Error("unreachable");
}
