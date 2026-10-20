import assert from "node:assert/strict";
import { test } from "node:test";

import { parseCliArguments } from "./cli-arguments.mjs";

test("retains setup/deploy/migrate/example invocations and parses an offline preview explicitly", () => {
  assert.deepEqual(parseCliArguments("setup", ["--yes"]), { yes: true });
  assert.deepEqual(parseCliArguments("migrate", ["--local"]), { local: true });
  assert.deepEqual(parseCliArguments("example", ["conference-booth", "--yes"]), {
    arg: "conference-booth",
    yes: true,
  });
  assert.deepEqual(parseCliArguments("settings-preview", ["saved.json", "--output", "new.json"]), {
    arg: "saved.json",
    output: "new.json",
  });
  assert.deepEqual(
    parseCliArguments("settings-apply", [
      "raw.json",
      "--preview",
      "review.json",
      "--source-config",
      "original.json",
      "--retain-ended",
      "--disable-legacy-review",
      "--local",
      "--yes",
    ]),
    {
      arg: "raw.json",
      preview: "review.json",
      "source-config": "original.json",
      "retain-ended": true,
      "disable-legacy-review": true,
      local: true,
      yes: true,
    },
  );
});

test("rejects misspelled/duplicate options and ambiguous positional arguments before execution", () => {
  for (const [command, args] of [
    ["setup", ["--account", "wrong"]],
    ["deploy", ["--local"]],
    ["settings-preview", ["--output"]],
    ["settings-preview", ["a", "b", "--output", "c"]],
    ["setup", ["--yes", "--yes"]],
    ["settings-apply", ["raw.json", "--preview"]],
    ["settings-apply", ["raw.json", "--yes", "--yes"]],
  ])
    assert.throws(() => parseCliArguments(command, args), /option|argument|output|preview/i);
});
