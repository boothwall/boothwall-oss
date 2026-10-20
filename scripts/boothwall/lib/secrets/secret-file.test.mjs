import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

import { API_DIR } from "../paths.mjs";
import { ensureSecretFile } from "./secret-file.mjs";

const fixture = () => join(mkdtempSync(join(tmpdir(), "boothwall-secret-")), ".dev.vars");

test("keeps an existing secret and every unrelated line on a rerun, with owner-only permissions", async () => {
  const path = fixture();
  const original = "# local settings\nOTHER=value\nADMIN_TOKEN=keep-this-secret\n";
  writeFileSync(path, original, { mode: 0o644 });
  assert.deepEqual(
    await ensureSecretFile(path, {
      askSecret: () => {
        throw Error("Must not prompt");
      },
    }),
    { created: false },
  );
  assert.equal(readFileSync(path, "utf8"), original);
  assert.equal(statSync(path).mode & 0o777, 0o600);
});

test("appends a generated secret without clobbering unrelated values or returning the credential", async () => {
  const path = fixture();
  writeFileSync(path, "OTHER=value");
  const result = await ensureSecretFile(path, {
    askSecret: async () => "",
    generateSecret: () => "new-secret-value",
  });
  assert.deepEqual(result, { created: true });
  assert.equal(readFileSync(path, "utf8"), "OTHER=value\nADMIN_TOKEN=new-secret-value\n");
  assert.equal(statSync(path).mode & 0o777, 0o600);
});

test("does not overwrite a concurrently created secret while the prompt is open", async () => {
  const path = fixture();
  const result = await ensureSecretFile(path, {
    askSecret: async () => {
      writeFileSync(path, "ADMIN_TOKEN=another-valid-secret\n", { mode: 0o600 });
      return "requested-secret";
    },
  });
  assert.equal(result.created, false);
  assert.equal(readFileSync(path, "utf8"), "ADMIN_TOKEN=another-valid-secret\n");
});

test("rejects symlinks, duplicate credentials and weak existing values without replacement", async () => {
  const path = fixture();
  writeFileSync(path, "ADMIN_TOKEN=short\n");
  await assert.rejects(ensureSecretFile(path), /passcode/i);
  assert.equal(readFileSync(path, "utf8"), "ADMIN_TOKEN=short\n");
  writeFileSync(path, "ADMIN_TOKEN=first-long-secret\nADMIN_TOKEN=other-long-secret\n");
  await assert.rejects(ensureSecretFile(path), /passcode/i);
  symlinkSync(path, `${path}-link`);
  await assert.rejects(ensureSecretFile(`${path}-link`), /regular|symbolic|link/i);
});

test("keeps a colon-assigned credential without prompting, appending or changing bytes", async () => {
  const path = fixture();
  const original =
    "# existing secret\r\nexport ADMIN_TOKEN: 'keep-this-secret' # old install\r\nOTHER=value\r\n";
  writeFileSync(path, original, { mode: 0o600 });
  assert.deepEqual(
    await ensureSecretFile(path, {
      askSecret: () => {
        throw Error("Must not prompt");
      },
    }),
    { created: false },
  );
  assert.equal(readFileSync(path, "utf8"), original);
});

test("rejects mixed equals/colon duplicate credentials regardless of assignment order", async () => {
  for (const original of [
    "ADMIN_TOKEN=strong-long-secret\nADMIN_TOKEN: weak\n",
    "ADMIN_TOKEN: strong-long-secret\nADMIN_TOKEN=weak\n",
    "ADMIN_TOKEN: first-long-secret\nADMIN_TOKEN: second-long-secret\n",
  ]) {
    const path = fixture();
    writeFileSync(path, original, { mode: 0o600 });
    await assert.rejects(ensureSecretFile(path), /ambiguous|passcode/);
    assert.equal(readFileSync(path, "utf8"), original);
  }
});

test("reads quoted/commented credentials as the provider does without mistaking quoted content for assignments", async () => {
  const path = fixture();
  const original =
    'OTHER="line one\nADMIN_TOKEN=not-an-assignment\nline three"\nADMIN_TOKEN: "keep-this-#-secret" # comment\n';
  writeFileSync(path, original, { mode: 0o600 });
  assert.deepEqual(
    await ensureSecretFile(path, {
      askSecret: () => {
        throw Error("Must not prompt");
      },
    }),
    { created: false },
  );
  assert.equal(readFileSync(path, "utf8"), original);
});

test("the pinned provider parser confirms colon/comment/quote semantics and duplicate last-write behavior", () => {
  const requireFromApi = createRequire(join(API_DIR, "package.json"));
  const directory = dirname(requireFromApi.resolve("cf"));
  const bundle = readdirSync(directory).find((name) => /^dotenv-.*\.mjs$/.test(name));
  assert.ok(bundle, "Review parser compatibility when the pinned CLI changes");
  const sources = [
    "export ADMIN_TOKEN: 'keep-this-secret' # comment\r\n",
    "ADMIN_TOKEN=strong-long-secret\nADMIN_TOKEN: weak\n",
    'OTHER="text\nADMIN_TOKEN=not-an-assignment\nend"\nADMIN_TOKEN: "keep-this-#-secret" # comment\n',
  ];
  // Import only the installed pure parser bundle in an isolated Node process, never the CLI.
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
    import { pathToFileURL } from "node:url";
    const parser = await import(pathToFileURL(process.argv[1]));
    const sources = JSON.parse(process.argv[2]);
    process.stdout.write(JSON.stringify(sources.map((source) => parser.i().parse(source).ADMIN_TOKEN)));
  `,
      join(directory, bundle),
      JSON.stringify(sources),
    ],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), ["keep-this-secret", "weak", "keep-this-#-secret"]);
});
