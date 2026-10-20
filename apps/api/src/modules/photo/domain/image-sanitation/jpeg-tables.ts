import { be16, requireImage } from "./binary";

/** Preserve precision per ID; baseline scans may only reference eight-bit tables. */
export function quantization(b: Uint8Array) {
  const tables: { id: number; precision: number }[] = [];
  let at = 0;
  while (at < b.length) {
    const info = b[at++]!,
      precision = info >> 4;
    requireImage(precision <= 1 && (info & 15) <= 3);
    const size = precision ? 128 : 64;
    requireImage(at + size <= b.length);
    for (let i = at; i < at + size; i += precision + 1)
      requireImage(precision ? be16(b, i) !== 0 : b[i] !== 0);
    tables.push({ id: info & 15, precision });
    at += size;
  }
  requireImage(tables.length > 0);
  return tables;
}

export function huffman(b: Uint8Array) {
  const tables: { id: number; symbols: Uint8Array }[] = [];
  let at = 0;
  while (at < b.length) {
    const info = b[at++]!;
    requireImage(info >> 4 <= 1 && (info & 15) <= 3 && at + 16 <= b.length);
    let sum = 0,
      slots = 1;
    for (let i = 0; i < 16; i++) {
      slots = slots * 2 - b[at + i]!;
      // JPEG reserves the all-one code at every length, including incomplete trees.
      requireImage(slots > 0);
      sum += b[at + i]!;
    }
    requireImage(sum > 0 && sum <= 256 && at + 16 + sum <= b.length);
    const symbols = b.subarray(at + 16, at + 16 + sum);
    for (const symbol of symbols)
      requireImage(info >> 4 === 0 ? symbol <= 11 : (symbol & 15) <= 10);
    tables.push({ id: info, symbols });
    at += 16 + sum;
  }
  requireImage(tables.length > 0);
  return tables;
}
