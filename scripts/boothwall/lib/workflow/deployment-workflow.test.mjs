import assert from "node:assert/strict";
import { test } from "node:test";

import { readConfig } from "../config-file.mjs";
import { runDeploy, runMigration, runSetup } from "./deployment-workflow.mjs";

const initial = await readConfig();
const accountId = "a".repeat(32);
const databaseId = "11111111-1111-4111-8111-111111111111";
function fixture() {
  let config = structuredClone(initial);
  let binding = null;
  let database = null;
  let bucket = false;
  let interrupt = false;
  const events = [];
  const messages = [];
  const deps = {
    readConfig: async () => config,
    updateConfig: (updates) => {
      events.push("config");
      for (const [path, value] of updates) {
        if (!path.includes(".")) config[path] = value;
        else {
          const [section, key] = path.split(".");
          config[section][key] = value;
        }
      }
    },
    readBinding: () => binding,
    bindTarget: (next) => {
      events.push("binding");
      binding = next;
    },
    ensureSecret: async () => {
      events.push("secret");
      return { created: true };
    },
    confirm: async () => true,
    log: (text) => messages.push(text),
    run: async (args, options) => {
      events.push(args.join(" "));
      if (args[0] !== "auth") assert.equal(options.env.CLOUDFLARE_ACCOUNT_ID, accountId);
      if (args[0] === "auth")
        return JSON.stringify({ authenticated: true, accounts: [{ id: accountId }] });
      if (args[1] === "list") return JSON.stringify(database ? [database] : []);
      if (args[2] === "list")
        return JSON.stringify({ buckets: bucket ? [{ name: "boothwall-photos" }] : [] });
      if (args[1] === "create") {
        database = { name: "boothwall", uuid: databaseId };
        if (interrupt) throw Error("Disconnected after create");
        return JSON.stringify(database);
      }
      if (args[2] === "create") {
        bucket = true;
        return "{}";
      }
      if (args[1] === "migrations") return "{}";
      if (args[0] === "deploy") {
        assert.equal(options.sensitive, true);
        return options.cwd.endsWith("api")
          ? "https://wall-api.example.workers.dev"
          : "https://wall.example.workers.dev";
      }
      throw Error(`Unexpected external command: ${args.join(" ")}`);
    },
  };
  return {
    deps,
    events,
    messages,
    get config() {
      return config;
    },
    set binding(value) {
      binding = value;
    },
    set interrupt(value) {
      interrupt = value;
    },
  };
}

test("setup shows and binds the target before mutation, deploys with pinned account, prints exact routes", async () => {
  const f = fixture();
  await runSetup({}, f.deps);
  assert.ok(f.events.indexOf("binding") < f.events.indexOf("d1 create --name boothwall"));
  assert.equal(f.config.deploy.d1DatabaseId, databaseId);
  assert.equal(f.config.demo, false);
  assert.ok(f.messages.some((text) => text.includes(accountId)));
  assert.ok(f.messages.some((text) => text.includes("https://wall.example.workers.dev/snap")));
  assert.ok(f.messages.some((text) => text.includes("https://wall.example.workers.dev/control")));
  assert.ok(f.messages.some((text) => text.includes("https://wall.example.workers.dev/")));
});

test("an interrupted setup reuses the exact created database and creates neither resource twice", async () => {
  const f = fixture();
  f.interrupt = true;
  await assert.rejects(runSetup({}, f.deps));
  f.interrupt = false;
  await runSetup({}, f.deps);
  await runSetup({}, f.deps);
  assert.equal(f.events.filter((event) => event === "d1 create --name boothwall").length, 1);
  assert.equal(
    f.events.filter((event) => event === "r2 buckets create --name boothwall-photos").length,
    1,
  );
});

test("invalid config, foreign binding and declined confirmation never write or mutate", async () => {
  for (const mode of ["invalid", "foreign", "declined"]) {
    const f = fixture();
    if (mode === "invalid") f.config.settings.secondsPerPhoto = 999;
    if (mode === "foreign")
      f.binding = { schemaVersion: 1, accountId: "b".repeat(32), name: "boothwall" };
    if (mode === "declined") f.deps.confirm = async () => false;
    await assert.rejects(runSetup({}, f.deps));
    assert.ok(
      !f.events.some((event) => /create|deploy|migrations|binding|config|secret/.test(event)),
    );
  }
});

test("deploy refuses an unconfigured database; validated reruns require no secret replacement", async () => {
  const f = fixture();
  await assert.rejects(runDeploy({}, f.deps), /setup|database/i);
  await runSetup({}, f.deps);
  f.events.length = 0;
  await runDeploy({}, f.deps);
  assert.equal(f.events.filter((event) => event === "secret").length, 0);
  assert.equal(f.events.filter((event) => event === "deploy").length, 2);
});

test("rechecks configuration after confirmation before binding or touching secrets/resources", async () => {
  const f = fixture();
  f.deps.confirm = async () => {
    f.config.settings.secondsPerPhoto = 999;
    return true;
  };
  await assert.rejects(runSetup({}, f.deps), /config/i);
  assert.ok(
    !f.events.some((event) => /create|deploy|migrations|binding|config|secret/.test(event)),
  );
});

test("local migration validates settings but never asks for provider identity", async () => {
  const f = fixture();
  const calls = [];
  f.deps.run = async (args, options) => {
    calls.push({ args, options });
    return "{}";
  };
  await runMigration({ local: true }, f.deps);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].args, [
    "d1",
    "migrations",
    "apply",
    "00000000-0000-4000-8000-000000000000",
    "--dir",
    "migrations",
    "--local",
    "--persist-to",
    ".cloudflare/state",
  ]);
  f.config.settings.secondsPerPhoto = 999;
  await assert.rejects(runMigration({ local: true }, f.deps));
  assert.equal(calls.length, 1);
});

test("a config edit during secret entry cannot write even a previously discovered database id", async () => {
  const f = fixture();
  await runSetup({}, f.deps);
  f.events.length = 0;
  f.deps.ensureSecret = async () => {
    f.config.settings.secondsPerPhoto = 999;
    return { created: false };
  };
  await assert.rejects(runSetup({}, f.deps), /config/i);
  assert.ok(!f.events.includes("config"));
});

test("redeploy records discovered URLs and rebuilds CORS and guest links before reporting them", async () => {
  const f = fixture();
  await runSetup({}, f.deps);
  f.config.urls.web = "https://old.example.com";
  f.events.length = 0;
  await runDeploy({}, f.deps);
  assert.equal(f.config.urls.web, "https://wall.example.workers.dev");
  assert.equal(f.events.filter((event) => event === "deploy").length, 4);
});
