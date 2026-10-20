import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { INK, STATUS } from "./surfaces.constants.ts";

// web-ui's theme CSS repeats these colours as literals; this keeps the two from drifting apart.
const themeCss = readFileSync(
  new URL("../../../../web-ui/src/theme/themes/boothwall.css", import.meta.url),
  "utf8",
);
const cssVar = (name: string) =>
  themeCss
    .match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1]
    ?.trim()
    .toUpperCase();

describe("web-ui theme colours", () => {
  it.each([
    ["u-ink", INK.onCanvas],
    ["u-ink-muted", INK.onCanvasMuted],
    ["u-ink-subtle", INK.onCanvasSubtle],
    ["u-paper-ink", INK.onPaper],
    ["u-success", STATUS.success],
    ["u-waiting", STATUS.waiting],
    ["u-danger", STATUS.danger],
  ])("--%s matches surfaces.ts", (name, value) => {
    expect(cssVar(name)).toBe(value.toUpperCase());
  });
});
