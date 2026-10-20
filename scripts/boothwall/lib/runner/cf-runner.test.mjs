import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { test } from "node:test";

import { createCfRunner } from "./cf-runner.mjs";

test("suppresses secret-bearing provider output and pins child account without changing process env", async () => {
  let captured;
  const run = createCfRunner({
    cliPath: process.execPath,
    root: process.cwd(),
    spawnProcess: (_bin, _args, options) => {
      captured = options;
      const child = new EventEmitter();
      child.stdout = new PassThrough();
      child.stderr = new PassThrough();
      queueMicrotask(() => {
        child.stderr.write("ADMIN_TOKEN=secret-from-provider");
        child.emit("close", 1);
      });
      return child;
    },
  });
  await assert.rejects(
    run(["deploy", "--secrets-file", ".dev.vars"], {
      sensitive: true,
      env: { CLOUDFLARE_ACCOUNT_ID: "fixture" },
    }),
    (error) => !error.message.includes("secret-from-provider") && error.message.includes("deploy"),
  );
  assert.equal(captured.env.CLOUDFLARE_ACCOUNT_ID, "fixture");
  assert.notEqual(process.env.CLOUDFLARE_ACCOUNT_ID, "fixture");
});

test("an interrupted local command is not mistaken for successful quiet completion", async () => {
  const run = createCfRunner({
    cliPath: process.execPath,
    root: process.cwd(),
    spawnProcess: () => {
      const child = new EventEmitter();
      child.stdout = new PassThrough();
      child.stderr = new PassThrough();
      queueMicrotask(() => child.emit("close", null, "SIGINT"));
      return child;
    },
  });
  await assert.rejects(run(["d1", "migrations", "apply", "local"], { settleMs: 3000 }), /failed/);
});
