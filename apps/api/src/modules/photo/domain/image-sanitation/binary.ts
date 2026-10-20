import { photoUnsupportedType } from "../photo.errors";

export const MAX_PARTS = 4096;
export function requireImage(condition: unknown): asserts condition {
  if (!condition) throw photoUnsupportedType({ type: "malformed-image" });
}
export const ascii = (b: Uint8Array, at: number, text: string) =>
  [...text].every((c, i) => b[at + i] === c.charCodeAt(0));
export const be16 = (b: Uint8Array, at: number) => ((b[at] ?? 0) << 8) | (b[at + 1] ?? 0);
export const be32 = (b: Uint8Array, at: number) => be16(b, at) * 65536 + be16(b, at + 2);
export const le16 = (b: Uint8Array, at: number) => (b[at] ?? 0) | ((b[at + 1] ?? 0) << 8);
export const le24 = (b: Uint8Array, at: number) => le16(b, at) + (b[at + 2] ?? 0) * 65536;
export const le32 = (b: Uint8Array, at: number) => le16(b, at) + le16(b, at + 2) * 65536;
export function joinBytes(parts: Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((sum, p) => sum + p.length, 0));
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

/** Retained color profile exception: bounded header and tag directory, not a profile interpreter. */
export function checkIcc(b: Uint8Array) {
  requireImage(
    b.length >= 132 && b.length <= 1024 * 1024 && be32(b, 0) === b.length && ascii(b, 36, "acsp"),
  );
  const count = be32(b, 128);
  requireImage(count <= MAX_PARTS && 132 + count * 12 <= b.length);
  for (let i = 0; i < count; i++) {
    const at = 132 + i * 12,
      offset = be32(b, at + 4),
      size = be32(b, at + 8);
    requireImage(
      offset >= 132 + count * 12 && offset % 4 === 0 && size >= 4 && offset + size <= b.length,
    );
  }
}
