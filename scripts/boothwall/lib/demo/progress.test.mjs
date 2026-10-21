import assert from "node:assert/strict";
import { test } from "node:test";
import { stripVTControlCharacters } from "node:util";

import { stage } from "./progress.mjs";

const rich = { rich: true, color: true, columns: 80 };

test("a stage settles into a tick with its measured time, or a cross that rethrows", async () => {
  let written = "";
  const write = (text) => (written += text);
  let clock = 1000;
  const now = () => clock;

  const result = await stage(
    "Starting the API",
    async () => {
      clock += 2300;
      return 12;
    },
    (count) => `${count} demo photos on the wall`,
    { output: rich, write, now },
  );
  assert.equal(result, 12);
  assert.match(stripVTControlCharacters(written), /✓ 12 demo photos on the wall {2}2\.3s\n$/);

  written = "";
  await assert.rejects(
    stage("Filling the wall", async () => Promise.reject(new Error("seed failed")), undefined, {
      output: rich,
      write,
      now,
    }),
    /seed failed/,
  );
  assert.match(stripVTControlCharacters(written), /✗ Filling the wall\n$/);
});
