import { stripVTControlCharacters } from "node:util";

/** Brand tomato #D9452B; the nearest 256-colour shade where 24-bit colour isn't announced. */
const tomato = (env, layer) =>
  /truecolor|24bit/i.test(env.COLORTERM ?? "") ? `${layer};2;217;69;43` : `${layer};5;167`;

/** Styles that collapse to the plain text when colour is off. */
export function painter({ color = false } = {}, env = process.env) {
  const paint = (codes) => (text) => (color ? `\x1b[${codes}m${text}\x1b[0m` : String(text));
  return {
    bold: paint("1"),
    dim: paint("2"),
    link: paint("4"),
    good: paint("32"),
    accent: paint(`1;${tomato(env, 38)}`),
    pill: paint(`1;97;${tomato(env, 48)}`),
  };
}

export const visibleWidth = (text) => stripVTControlCharacters(text).length;

const pad = (text, width) => text + " ".repeat(Math.max(0, width - visibleWidth(text)));

export const centre = (text, width) =>
  " ".repeat(Math.max(0, Math.floor((width - visibleWidth(text)) / 2))) + text;

/** Two columns, the shorter one centred vertically against the taller. */
export function besides(left, right, gap) {
  const width = Math.max(...left.map(visibleWidth));
  const rows = Math.max(left.length, right.length);
  const offset = (lines) => Math.floor((rows - lines.length) / 2);
  const at = (lines, row) => lines[row - offset(lines)] ?? "";
  return Array.from({ length: rows }, (_, row) =>
    `${pad(at(left, row), width)}${" ".repeat(gap)}${at(right, row)}`.trimEnd(),
  );
}
