import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { emitWorkers, publicRepository } from "../testing/index.mjs";
import { buildFixture } from "./index.mjs";

test("preexisting dependencies are refused before command execution", async (t) => {
  const f = publicRepository(t);
  mkdirSync(join(f.repository, "node_modules"));
  let called = false;
  await assert.rejects(
    buildFixture(
      {
        repository: f.repository,
        commit: f.branch,
        tree: f.tree,
        base: f.base,
        version: "1.2.3",
        phase: "branch",
        output: join(f.root, "packet"),
      },
      async () => {
        called = true;
        return { status: 0, stdout: "", stderr: "" };
      },
    ),
    /Fresh/,
  );
  assert.equal(called, false);
});
test("failed checks and a source change during build never produce a successful receipt", async (t) => {
  for (const changeSource of [false, true]) {
    const f = publicRepository(t);
    await assert.rejects(
      buildFixture(
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
          if (!changeSource && step.id === "test")
            return { status: 1, stdout: "", stderr: "fixture failure" };
          if (step.id === "build-web") {
            emitWorkers(f);
            f.write("apps/web/index.html", "mutated during build");
          }
          return { status: 0, stdout: "", stderr: "" };
        },
      ),
      changeSource ? /dirty|changed/ : /Public check failed: test/,
    );
  }
});

test("an output path aliased into the source checkout is rejected before commands", async (t) => {
  const f = publicRepository(t),
    alias = join(f.root, "source-alias");
  const { symlinkSync } = await import("node:fs");
  symlinkSync(f.repository, alias);
  let called = false;
  await assert.rejects(
    buildFixture(
      {
        repository: f.repository,
        commit: f.branch,
        tree: f.tree,
        base: f.base,
        version: "1.2.3",
        phase: "branch",
        output: join(alias, "receipt"),
      },
      async () => {
        called = true;
        return { status: 1 };
      },
    ),
    /outside/,
  );
  assert.equal(called, false);
});
