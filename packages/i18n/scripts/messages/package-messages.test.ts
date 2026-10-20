import { fileURLToPath } from "node:url";

import { expect, it } from "vitest";

import { compileMessages } from "./compile-messages.ts";

const at = (path: string) => fileURLToPath(new URL(path, import.meta.url));

it("this package's catalogues are complete and compiled (run `pnpm messages` after editing)", () => {
  const { problems } = compileMessages({
    sourceDir: at("../../messages"),
    outDir: at("../../src/messages"),
    runtime: "#catalogue",
    check: true,
  });
  expect(problems).toEqual([]);
});
