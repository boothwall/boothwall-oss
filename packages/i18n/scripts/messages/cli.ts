#!/usr/bin/env node
// boothwall-messages <messages dir> <generated dir> [--check] [--runtime <specifier>]
import { resolve } from "node:path";
import { parseArgs } from "node:util";

import { compileMessages } from "./compile-messages.ts";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { check: { type: "boolean" }, runtime: { type: "string" } },
});
const [sourceDir, outDir] = positionals;
if (!sourceDir || !outDir) {
  console.error(
    "Usage: boothwall-messages <messages dir> <generated dir> [--check] [--runtime <specifier>]",
  );
  process.exit(2);
}

const { problems, written } = compileMessages({
  sourceDir: resolve(sourceDir),
  outDir: resolve(outDir),
  runtime: values.runtime,
  check: values.check,
});
for (const path of written) console.info(`wrote ${path}`);
for (const problem of problems) console.error(problem);
if (problems.length) process.exit(1);
console.info(
  values.check ? "messages up to date" : `messages compiled (${written.length} changed)`,
);
