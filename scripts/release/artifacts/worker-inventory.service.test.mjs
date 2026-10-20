import assert from "node:assert/strict";
import { test } from "node:test";

import { emitWorkers, publicRepository } from "../testing/index.mjs";
import { snapshotWorkers } from "./index.mjs";

test("emitted worker bytes determine inventory; source maps cannot enter the packet", (t) => {
  const fixture = publicRepository(t);
  emitWorkers(fixture);
  const result = snapshotWorkers(fixture.repository);
  assert.equal(result.files.length, 4);
  assert.equal(
    result.files.find((file) => file.path.endsWith("bundle/index.js")).size,
    Buffer.byteLength("export const fixture = true;"),
  );
  assert.equal(result.contents.size, 4);
  fixture.write("apps/web/.cloudflare/output/v0/workers/default/assets/secret.js.map", "{}");
  assert.throws(() => snapshotWorkers(fixture.repository), /Unsupported emitted/);
});
