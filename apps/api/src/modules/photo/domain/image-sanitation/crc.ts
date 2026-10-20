const TABLE = Object.freeze(
  Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    return c >>> 0;
  }),
);
export function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const b of bytes) crc = (crc >>> 8) ^ TABLE[(crc ^ b) & 255]!;
  return (crc ^ 0xffffffff) >>> 0;
}
