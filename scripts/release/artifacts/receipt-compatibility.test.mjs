import assert from "node:assert/strict";
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { emitWorkers, publicRepository } from "../testing/index.mjs";
import { buildFixture } from "../workflow/index.mjs";
import { readReceipt, writeReceipt } from "./receipt-packet.service.mjs";
import { validateReceipt } from "./receipt-validation.service.mjs";
import { legacyNativeEvidence } from "./worker-profile.constants.mjs";

test("v1 receipt bytes stay verifiable but cannot gate a new final build or gain v2 native scope", async (t) => {
  const f = publicRepository(t);
  const request = {
    repository: f.repository,
    commit: f.branch,
    tree: f.tree,
    base: f.base,
    version: "1.2.3",
  };
  const packet = await buildFixture(
    { ...request, phase: "branch", output: join(f.root, "current") },
    async ({ id }) => {
      if (id === "build-web") emitWorkers(f);
      return { status: 0, stdout: "fixture", stderr: "" };
    },
  );
  const receipt = { ...packet.receipt, schemaVersion: 1, native: legacyNativeEvidence };
  const legacy = writeReceipt(join(f.root, "legacy"), receipt, packet.contents);
  const before = readFileSync(join(legacy.directory, "receipt.json"));
  assert.deepEqual(readReceipt(legacy.directory, legacy.digest).receipt, receipt);
  assert.deepEqual(readFileSync(join(legacy.directory, "receipt.json")), before);
  assert.throws(() => validateReceipt({ ...receipt, schemaVersion: 2 }), /native/);
  for (const app of ["api", "web"])
    rmSync(join(f.repository, `apps/${app}/.cloudflare`), { recursive: true });
  let runs = 0;
  await assert.rejects(
    buildFixture(
      {
        ...request,
        commit: f.merge(),
        phase: "final",
        branchCommit: f.branch,
        branchReceipt: legacy.directory,
        branchDigest: legacy.digest,
        output: join(f.root, "final"),
      },
      async () => {
        runs++;
        return { status: 0, stdout: "", stderr: "" };
      },
    ),
    /branch receipt/,
  );
  assert.equal(runs, 0);
});
