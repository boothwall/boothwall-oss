import assert from "node:assert/strict";
import { test } from "node:test";

import { buildEnvironment } from "./index.mjs";

test("child processes receive no token, provider settings, runtime identity or user config", () => {
  const environment = buildEnvironment(
    {
      PATH: "/bin",
      HOME: "/private-home",
      GITHUB_TOKEN: "fixture",
      ACTIONS_RUNTIME_TOKEN: "fixture",
      NODE_OPTIONS: "injected",
      VITE_API_URL: "https://wrong.example",
      BOOTHWALL_BUILD_IDENTITY: "wrong",
      NPM_CONFIG_USERCONFIG: "/secret",
      ADMIN_TOKEN: "fixture",
    },
    "/isolated-home",
  );
  assert.equal(environment.HOME, "/isolated-home");
  assert.equal(environment.NPM_CONFIG_USERCONFIG, "/dev/null");
  for (const key of [
    "GITHUB_TOKEN",
    "ACTIONS_RUNTIME_TOKEN",
    "NODE_OPTIONS",
    "VITE_API_URL",
    "BOOTHWALL_BUILD_IDENTITY",
    "ADMIN_TOKEN",
  ])
    assert.equal(environment[key], undefined);
});
