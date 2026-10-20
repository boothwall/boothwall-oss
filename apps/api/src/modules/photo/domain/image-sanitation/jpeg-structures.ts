import { be16, requireImage } from "./binary";

export type Frame = {
  width: number;
  height: number;
  progressive: boolean;
  components: Map<number, number>;
  scanned: Set<number>;
  coefficients: Map<number, Int8Array>;
};
export function frame(b: Uint8Array, progressive: boolean): Frame {
  const n = b[5]!;
  requireImage(b.length === 6 + 3 * n && [1, 3, 4].includes(n) && b[0] === 8);
  const width = be16(b, 3),
    height = be16(b, 1),
    components = new Map<number, number>();
  requireImage(width > 0 && height > 0);
  for (let i = 0; i < n; i++) {
    const at = 6 + i * 3,
      id = b[at]!,
      sampling = b[at + 1]!,
      q = b[at + 2]!;
    requireImage(
      !components.has(id) &&
        sampling >> 4 >= 1 &&
        sampling >> 4 <= 4 &&
        (sampling & 15) >= 1 &&
        (sampling & 15) <= 4 &&
        q <= 3,
    );
    components.set(id, q);
  }
  return { width, height, progressive, components, scanned: new Set(), coefficients: new Map() };
}
export function scan(
  b: Uint8Array,
  f: Frame,
  quant: Map<number, number>,
  huff: Map<number, Uint8Array>,
) {
  const n = b[0]!,
    ss = b[1 + 2 * n]!,
    se = b[2 + 2 * n]!,
    approximation = b[3 + 2 * n]!;
  requireImage(n > 0 && n <= f.components.size && b.length === 4 + n * 2);
  const ah = approximation >> 4,
    al = approximation & 15;
  requireImage(
    f.progressive
      ? ss <= se &&
          se <= 63 &&
          ah <= 13 &&
          al <= 13 &&
          (ah === 0 || ah === al + 1) &&
          (ss === 0 ? se === 0 : n === 1)
      : ss === 0 && se === 63 && approximation === 0,
  );
  const seen = new Set<number>();
  for (let i = 0; i < n; i++) {
    const id = b[1 + i * 2]!,
      tables = b[2 + i * 2]!;
    requireImage(
      !seen.has(id) &&
        f.components.has(id) &&
        quant.has(f.components.get(id)!) &&
        tables >> 4 <= 3 &&
        (tables & 15) <= 3,
    );
    if (!f.progressive) {
      requireImage(!f.scanned.has(id) && quant.get(f.components.get(id)!) === 0);
    } else {
      const state = f.coefficients.get(id) ?? new Int8Array(64).fill(-1);
      requireImage(ss === 0 || state[0]! >= 0);
      for (let coefficient = ss; coefficient <= se; coefficient++) {
        requireImage(ah === 0 ? state[coefficient] === -1 : state[coefficient] === ah);
        state[coefficient] = al;
      }
      f.coefficients.set(id, state);
    }
    if (ss === 0 && ah === 0) f.scanned.add(id);
    if (!f.progressive || (ss === 0 && ah === 0)) requireImage(huff.has(tables >> 4));
    if (!f.progressive || ss !== 0) {
      const symbols = huff.get(0x10 | (tables & 15));
      requireImage(symbols);
      for (const symbol of symbols) {
        if (!f.progressive) requireImage((symbol & 15) !== 0 || symbol === 0 || symbol === 240);
      }
    }
    seen.add(id);
  }
}
