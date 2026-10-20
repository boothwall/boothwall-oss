import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { fixtureBuildPair, publicRepository } from "../testing/index.mjs";

const cli = fileURLToPath(new URL("./public-build.cli.mjs", import.meta.url));
test("standalone CLI verifies actual local packets without upgrading fixture evidence or defaulting to a build", async (t) => {
  const f = publicRepository(t),
    pair = await fixtureBuildPair({
      repository: f.repository,
      base: f.base,
      branch: f.branch,
      tree: f.tree,
      version: "1.2.3",
      output: f.root,
    });
  const invoke = (args) =>
    spawnSync(process.execPath, [cli, ...args], {
      cwd: f.repository,
      env: { PATH: "/usr/bin:/bin", HOME: "/dev/null" },
      encoding: "utf8",
    });
  const result = invoke(["verify", pair.final.directory, pair.final.digest]);
  assert.equal(result.status, 0, result.stderr);
  const receipt = JSON.parse(result.stdout).receipt;
  assert.equal(receipt.source.commit, pair.publicCommit);
  assert.equal(receipt.execution, "fixture");
  assert.equal(receipt.publishable, false);
  const defaultCall = invoke([]);
  assert.equal(defaultCall.status, 1);
  assert.equal(defaultCall.stdout, "");
  assert.equal(invoke(["verify", pair.final.directory, "0".repeat(64)]).status, 1);
});
