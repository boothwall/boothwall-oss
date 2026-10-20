import { be16, be32, requireImage } from "./binary";
import { checkCompressedIcc } from "./inflate-profile";

export async function pngColor(
  type: string,
  b: Uint8Array,
  color: number,
  depth: number,
  palette: number,
) {
  if (type === "gAMA") requireImage(b.length === 4 && be32(b, 0) > 0);
  else if (type === "cHRM") requireImage(b.length === 32);
  else if (type === "sRGB") requireImage(b.length === 1 && b[0]! <= 3);
  else if (type === "cICP") requireImage(b.length === 4 && b[2] === 0 && b[3]! <= 1);
  else if (type === "mDCV") requireImage(b.length === 24);
  else if (type === "cLLI") requireImage(b.length === 8);
  else if (type === "pHYs") requireImage(b.length === 9 && b[8]! <= 1);
  else if (type === "sBIT") {
    const count = ({ 0: 1, 2: 3, 3: 3, 4: 2, 6: 4 } as Record<number, number>)[color];
    requireImage(
      b.length === count && [...b].every((n) => n > 0 && n <= (color === 3 ? 8 : depth)),
    );
  } else if (type === "tRNS") {
    requireImage(
      color === 3
        ? palette > 0 && b.length > 0 && b.length <= palette
        : color === 0
          ? b.length === 2 && be16(b, 0) < 2 ** depth
          : color === 2 && b.length === 6 && [0, 2, 4].every((i) => be16(b, i) < 2 ** depth),
    );
  } else if (type === "bKGD") {
    requireImage(
      color === 3
        ? b.length === 1 && b[0]! < palette
        : [0, 4].includes(color)
          ? b.length === 2 && be16(b, 0) < 2 ** depth
          : b.length === 6 && [0, 2, 4].every((i) => be16(b, i) < 2 ** depth),
    );
  } else if (type === "hIST") requireImage(palette > 0 && b.length === palette * 2);
  else if (type === "iCCP") {
    const zero = b.indexOf(0);
    requireImage(zero > 0 && zero <= 79 && b[zero + 1] === 0 && zero + 2 < b.length);
    const name = b.subarray(0, zero);
    requireImage(
      name[0] !== 32 &&
        name.at(-1) !== 32 &&
        !name.some(
          (n, i) => !((n >= 32 && n <= 126) || n >= 161) || (n === 32 && name[i - 1] === 32),
        ),
    );
    await checkCompressedIcc(b.subarray(zero + 2));
  } else requireImage(false);
}
