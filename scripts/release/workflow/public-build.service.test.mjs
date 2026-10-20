import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { readReceipt } from "../artifacts/index.mjs";
import { emitWorkers, publicRepository } from "../testing/index.mjs";
import { buildFixture } from "./index.mjs";

test("branch checks and emitted bytes gate an exact final public commit before its build starts", async (t) => {
  const fixture = publicRepository(t),
    calls = [];
  const runner = async (step) => {
    calls.push(step.id);
    if (step.id === "build-web") emitWorkers(fixture);
    return { status: 0, stdout: "fixture", stderr: "" };
  };
  const request = {
    repository: fixture.repository,
    commit: fixture.branch,
    tree: fixture.tree,
    base: fixture.base,
    version: "1.2.3",
  };
  const branch = await buildFixture(
    { ...request, phase: "branch", output: join(fixture.root, "branch") },
    runner,
  );
  assert.equal(branch.receipt.schemaVersion, 2);
  assert.deepEqual(
    branch.receipt.native.map(({ platform }) => platform),
    ["vega"],
  );
  assert.equal(branch.receipt.execution, "fixture");
  assert.equal(branch.receipt.publishable, false);
  assert.deepEqual(readReceipt(branch.directory, branch.digest).receipt, branch.receipt);
  for (const app of ["api", "web"])
    rmSync(join(fixture.repository, `apps/${app}/.cloudflare`), { recursive: true });
  const final = fixture.merge();
  calls.length = 0;
  const finalRequest = {
    ...request,
    commit: final,
    branchCommit: fixture.branch,
    phase: "final",
    output: join(fixture.root, "final"),
    branchReceipt: branch.directory,
    branchDigest: branch.digest,
  };
  await assert.rejects(
    buildFixture({ ...finalRequest, branchDigest: "0".repeat(64) }, runner),
    /digest/,
  );
  assert.equal(calls.length, 0);
  const result = await buildFixture(finalRequest, runner);
  assert.equal(result.receipt.source.commit, final);
  assert.equal(result.receipt.branchReceiptDigest, branch.digest);
  assert.deepEqual(
    result.receipt.native.map((item) => item.status),
    ["not-built"],
  );
  assert.deepEqual(calls, ["install", "delegates", "build-api", "build-web"]);
});
