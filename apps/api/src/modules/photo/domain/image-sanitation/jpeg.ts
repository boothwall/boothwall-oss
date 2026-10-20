import { ascii, be16, checkIcc, joinBytes, MAX_PARTS, requireImage } from "./binary";
import { checkExif } from "./exif";
import { type Frame, frame, scan } from "./jpeg-structures";
import { huffman, quantization } from "./jpeg-tables";

/** Walk every scan through EOI; never re-encode entropy or infer codec safety. */
export function sanitizeJpeg(b: Uint8Array) {
  requireImage(b.length >= 4 && b[0] === 255 && b[1] === 216);
  const parts = [b.subarray(0, 2)],
    quant = new Map<number, number>(),
    huff = new Map<number, Uint8Array>();
  const icc = new Map<number, Uint8Array>();
  let at = 2,
    count = 0,
    scans = 0,
    f: Frame | undefined,
    iccCount = 0,
    adobe: number | undefined,
    jfif = false,
    exif = false;
  while (at < b.length) {
    requireImage(++count <= MAX_PARTS && b[at] === 255);
    const start = at++;
    while (b[at] === 255) at++;
    const marker = b[at++]!;
    if (marker === 217) {
      requireImage(
        f &&
          scans > 0 &&
          f.scanned.size === f.components.size &&
          at === b.length &&
          icc.size === iccCount,
      );
      const components = f.components.size;
      requireImage(!jfif || components === 1 || components === 3);
      if (adobe !== undefined) {
        requireImage(components === 1 ? adobe === 0 : components === 3 ? adobe <= 1 : adobe !== 1);
        requireImage(!jfif || adobe === (components === 3 ? 1 : 0));
      }
      if (iccCount)
        checkIcc(
          joinBytes(
            Array.from({ length: iccCount }, (_, i) => {
              const p = icc.get(i + 1);
              requireImage(p);
              return p;
            }),
          ),
        );
      parts.push(b.subarray(start, at));
      return { bytes: joinBytes(parts), width: f.width, height: f.height };
    }
    requireImage(at + 2 <= b.length);
    const length = be16(b, at),
      end = at + length;
    requireImage(length >= 2 && end <= b.length);
    const data = b.subarray(at + 2, end);
    let keep = true;
    if (marker === 192 || marker === 194) {
      requireImage(!f && !scans);
      f = frame(data, marker === 194);
    } else if (marker === 219)
      for (const table of quantization(data)) quant.set(table.id, table.precision);
    else if (marker === 196) for (const table of huffman(data)) huff.set(table.id, table.symbols);
    else if (marker === 221) requireImage(data.length === 2);
    else if (marker === 218) {
      requireImage(f);
      scan(data, f, quant, huff);
      scans++;
    } else if (marker === 224 && ascii(data, 0, "JFIF\0")) {
      requireImage(
        data.length >= 14 &&
          data[5] === 1 &&
          data[7]! <= 2 &&
          data.length === 14 + 3 * data[12]! * data[13]!,
      );
      jfif = true;
      const clean = data.slice(0, 14);
      clean[12] = 0;
      clean[13] = 0;
      parts.push(new Uint8Array([255, 224, 0, 16]), clean);
      keep = false;
    } else if (marker === 225 && ascii(data, 0, "Exif\0\0")) {
      requireImage(!exif);
      checkExif(data);
      exif = true;
      keep = false;
    } else if (marker === 226 && ascii(data, 0, "ICC_PROFILE\0")) {
      requireImage(
        data.length > 14 &&
          data[12]! > 0 &&
          data[13]! > 0 &&
          data[12]! <= data[13]! &&
          !icc.has(data[12]!) &&
          (!iccCount || iccCount === data[13]!),
      );
      iccCount = data[13]!;
      icc.set(data[12]!, data.subarray(14));
    } else if (marker === 238 && ascii(data, 0, "Adobe")) {
      requireImage(adobe === undefined && data.length === 12 && data[11]! <= 2);
      adobe = data[11]!;
    } else if ((marker >= 224 && marker <= 239) || marker === 254) keep = false;
    else requireImage(false);
    if (keep) parts.push(b.subarray(start, end));
    at = end;
    if (marker === 218) {
      const entropy = at;
      while (at < b.length) {
        if (b[at] !== 255) {
          at++;
          continue;
        }
        let next = at + 1;
        while (b[next] === 255) next++;
        if (b[next] === 0 || (b[next]! >= 208 && b[next]! <= 215)) {
          at = next + 1;
          continue;
        }
        break;
      }
      requireImage(at > entropy);
      parts.push(b.subarray(entropy, at));
    }
  }
  requireImage(false);
  throw new Error("unreachable");
}
