import assert from "node:assert/strict";
import { chmodSync, readFileSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { canonical, digest } from "../core/index.mjs";
import { emitWorkers, publicRepository } from "../testing/index.mjs";
import { buildFixture } from "../workflow/index.mjs";
import { readReceipt } from "./index.mjs";

async function packet(t) {
  const f = publicRepository(t);
  const result = await buildFixture(
    {
      repository: f.repository,
      commit: f.branch,
      tree: f.tree,
      base: f.base,
      version: "1.2.3",
      phase: "branch",
      output: join(f.root, "packet"),
    },
    async (step) => {
      if (step.id === "build-web") emitWorkers(f);
      return { status: 0, stdout: "fixture", stderr: "" };
    },
  );
  return { f, result };
}
test("receipt verification detects mutated blob bytes and symbolic packet files", async (t) => {
  const { f, result } = await packet(t),
    blob = join(result.directory, "blobs", result.receipt.artifacts.files[0].digest);
  const bytes = readFileSync(blob);
  chmodSync(blob, 0o644);
  writeFileSync(blob, "tampered");
  assert.throws(() => readReceipt(result.directory, result.digest), /digest|size/);
  writeFileSync(blob, bytes);
  const external = join(f.root, "external");
  writeFileSync(external, bytes);
  unlinkSync(blob);
  symlinkSync(external, blob);
  assert.throws(() => readReceipt(result.directory, result.digest), /Symbolic/);
});
test("recomputed JSON hashes cannot remove required checks or claim native success", async (t) => {
  const { result } = await packet(t),
    path = join(result.directory, "receipt.json");
  chmodSync(path, 0o644);
  for (const change of [
    (receipt) => receipt.checks.pop(),
    (receipt) => {
      receipt.native[0].status = "built";
    },
    (receipt) => {
      receipt.approval = true;
    },
  ]) {
    const altered = structuredClone(result.receipt);
    change(altered);
    writeFileSync(path, canonical(altered));
    assert.throws(
      () => readReceipt(result.directory, digest(altered)),
      /Missing|Unsupported|Unexpected/,
    );
  }
});
