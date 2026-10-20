import { ascii, MAX_PARTS, requireImage } from "./binary";

/** Only normalized orientation is accepted; all EXIF bytes are subsequently discarded. */
export function checkExif(b: Uint8Array) {
  if (ascii(b, 0, "Exif\0\0")) b = b.subarray(6);
  requireImage(b.length >= 8);
  const little = ascii(b, 0, "II");
  requireImage(little || ascii(b, 0, "MM"));
  const d = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const u16 = (at: number) => {
    requireImage(at >= 0 && at + 2 <= b.length);
    return d.getUint16(at, little);
  };
  const u32 = (at: number) => {
    requireImage(at >= 0 && at + 4 <= b.length);
    return d.getUint32(at, little);
  };
  requireImage(u16(2) === 42);
  const pending = [u32(4)],
    seen = new Set<number>();
  const sizes = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8, 4];
  let entries = 0,
    orientations = 0;
  while (pending.length) {
    const at = pending.pop()!;
    requireImage(at >= 8 && !seen.has(at) && seen.size < 32);
    seen.add(at);
    const n = u16(at);
    entries += n;
    requireImage(entries <= MAX_PARTS && at + 2 + n * 12 + 4 <= b.length);
    for (let i = 0; i < n; i++) {
      const e = at + 2 + i * 12,
        tag = u16(e),
        type = u16(e + 2),
        count = u32(e + 4);
      const size = (sizes[type] ?? 0) * count;
      requireImage(type > 0 && type < sizes.length && Number.isSafeInteger(size));
      const value = size <= 4 ? e + 8 : u32(e + 8);
      requireImage(value + size <= b.length);
      if (tag === 0x112)
        requireImage(++orientations === 1 && type === 3 && count === 1 && u16(value) === 1);
      if ([0x8769, 0x8825, 0xa005].includes(tag)) {
        requireImage((type === 4 || type === 13) && count === 1);
        pending.push(u32(value));
      }
    }
    const next = u32(at + 2 + n * 12);
    if (next) pending.push(next);
  }
}
