import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { bindTarget, readTargetBinding } from "./target-binding.mjs";

test("records an immutable account/name binding and refuses a foreign rerun without overwriting", () => {
  const path = join(mkdtempSync(join(tmpdir(), "boothwall-target-")), ".dev.vars.setup.json");
  const binding = { schemaVersion: 1, accountId: "a".repeat(32), name: "my-wall" };
  assert.equal(readTargetBinding(path), null);
  bindTarget(binding, path);
  bindTarget(binding, path);
  const before = readFileSync(path, "utf8");
  assert.equal(statSync(path).mode & 0o777, 0o600);
  assert.deepEqual(readTargetBinding(path), binding);
  assert.throws(() => bindTarget({ ...binding, accountId: "b".repeat(32) }, path), /target/i);
  assert.equal(readFileSync(path, "utf8"), before);
});
