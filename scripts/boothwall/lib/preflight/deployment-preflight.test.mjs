import assert from "node:assert/strict";
import { test } from "node:test";

import { readConfig } from "../config-file.mjs";
import { inspectDeploymentTarget } from "./deployment-preflight.mjs";

const accountId = "a".repeat(32);
const databaseId = "11111111-1111-4111-8111-111111111111";
const config = await readConfig();
const makeRunner = (overrides = {}) => {
  const calls = [];
  const run = async (args, options) => {
    calls.push({ args, options });
    if (args[0] === "auth")
      return JSON.stringify({
        authenticated: true,
        accounts: [{ id: accountId, name: "My account" }],
      });
    if (args[0] === "d1")
      return JSON.stringify(overrides.databases ?? [{ uuid: databaseId, name: "boothwall" }]);
    if (args[0] === "r2")
      return JSON.stringify({
        buckets: [{ name: "boothwall-photos-other" }, { name: "boothwall-photos" }],
      });
    throw Error("Unexpected external command");
  };
  return { run, calls };
};

test("rejects invalid effective settings before any provider command", async () => {
  const runner = makeRunner();
  await assert.rejects(
    inspectDeploymentTarget({ ...config, settings: { secondsPerPhoto: 999 } }, runner),
    /config/i,
  );
  assert.equal(runner.calls.length, 0);
});

test("pins every resource lookup to the selected account and matches exact resource identity", async () => {
  const runner = makeRunner();
  const target = await inspectDeploymentTarget(
    { ...config, deploy: { ...config.deploy, d1DatabaseId: databaseId } },
    runner,
  );
  assert.equal(target.accountId, accountId);
  assert.equal(target.databaseId, databaseId);
  assert.equal(target.bucketExists, true);
  for (const call of runner.calls.slice(1))
    assert.equal(call.options.env.CLOUDFLARE_ACCOUNT_ID, accountId);
});

test("does not silently replace a foreign database id or accept the wrong name", async () => {
  for (const databases of [[], [{ uuid: databaseId, name: "another-wall" }]]) {
    const runner = makeRunner({ databases });
    await assert.rejects(
      inspectDeploymentTarget(
        { ...config, deploy: { ...config.deploy, d1DatabaseId: databaseId } },
        runner,
      ),
      /database/i,
    );
    assert.ok(runner.calls.every(({ args }) => !args.includes("create")));
  }
});

test("rejects a target account outside authenticated membership", async () => {
  const runner = makeRunner();
  await assert.rejects(
    inspectDeploymentTarget(config, { ...runner, accountId: "b".repeat(32) }),
    /account/i,
  );
  assert.equal(runner.calls.length, 1);
});

test("refuses malformed resource output instead of treating it as an empty account", async () => {
  const runner = makeRunner();
  await assert.rejects(
    inspectDeploymentTarget(config, {
      run: (args, options) =>
        args[0] === "auth" ? runner.run(args, options) : Promise.resolve("not JSON"),
    }),
    /inspect/i,
  );
});

test("checks domain ownership against the pinned account before setup", async () => {
  const runner = makeRunner();
  await assert.rejects(
    inspectDeploymentTarget(
      { ...config, deploy: { ...config.deploy, apiDomain: "api.example.com" } },
      {
        run: (args, options) =>
          args[0] === "zones"
            ? Promise.resolve(
                JSON.stringify([{ name: "example.com", account: { id: "b".repeat(32) } }]),
              )
            : runner.run(args, options),
      },
    ),
    /domain/i,
  );
});

test("a partial first database page cannot cause duplicate resource creation", async () => {
  const runner = makeRunner();
  let pages = 0;
  const target = await inspectDeploymentTarget(config, {
    run: (args, options) => {
      if (args[0] !== "d1") return runner.run(args, options);
      pages += 1;
      return Promise.resolve(
        JSON.stringify(
          pages === 1
            ? Array.from({ length: 100 }, (_, i) => ({ name: `other-${i}`, uuid: databaseId }))
            : [{ name: "boothwall", uuid: databaseId }],
        ),
      );
    },
  });
  assert.equal(target.databaseId, databaseId);
  assert.equal(pages, 2);
});

test("unsupported configured review policy is named and rejected before provider calls", async () => {
  const runner = makeRunner();
  await assert.rejects(
    inspectDeploymentTarget(
      {
        ...config,
        settings: { smartModeration: { enabled: true, autoApproveSafe: false, holdFlagged: true } },
      },
      runner,
    ),
    /smartModeration/,
  );
  assert.equal(runner.calls.length, 0);
});
