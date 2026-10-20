import assert from "node:assert/strict";
import { test } from "node:test";

import { publicRepository } from "../testing/index.mjs";
import { readPublicSource } from "./index.mjs";

test("public source identity comes from the exact committed tree and current bytes", (t) => {
  const f = publicRepository(t),
    request = { repository: f.repository, commit: f.branch, tree: f.tree, base: f.base };
  const source = readPublicSource(request, "branch");
  assert.equal(source.commit, f.branch);
  assert.equal(source.tree, f.tree);
  assert.match(source.filesDigest, /^[a-f0-9]{64}$/);
  assert.throws(() => readPublicSource({ ...request, tree: "a".repeat(40) }, "branch"), /tree/);
  f.write("apps/web/index.html", "changed");
  assert.throws(() => readPublicSource(request, "branch"), /dirty|changed/);
});

test("ignored local environment data and an unrelated merge parent fail source verification", (t) => {
  const f = publicRepository(t);
  f.write(".gitignore", "node_modules/\n.cloudflare/\n.env\n");
  const branch = f.commit("ignore local state"),
    tree = f.git("rev-parse", "HEAD^{tree}");
  f.write(".env", "FIXTURE_ONLY=true");
  assert.throws(
    () =>
      readPublicSource(
        { repository: f.repository, commit: branch, tree, base: f.branch },
        "branch",
      ),
    /environment/,
  );
  assert.throws(
    () =>
      readPublicSource({ repository: f.repository, commit: branch, tree, base: f.base }, "branch"),
    /parents/,
  );
});

for (const path of ["apps/tv-android/README.md", "packages/android-runtime/src/index.ts"]) {
  test(`new public build source rejects ${path}`, (t) => {
    const f = publicRepository(t);
    f.write(path, "historical native bytes");
    const commit = f.commit("retired native fixture");
    const tree = f.git("rev-parse", "HEAD^{tree}");
    assert.throws(
      () => readPublicSource({ repository: f.repository, commit, tree, base: f.branch }, "branch"),
      /Android/,
    );
  });
}
