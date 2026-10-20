import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

test("a FIFO is rejected as a nonregular packet file without waiting for a writer", (t) => {
  const root = mkdtempSync(join(realpathSync(tmpdir()), "public-file-")),
    path = join(root, "fifo");
  t.after(() => rmSync(root, { recursive: true, force: true }));
  execFileSync("mkfifo", [path]);
  const module = new URL("./files.service.mjs", import.meta.url).href;
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `const {readFile}=await import(process.argv[1]);try{readFile(process.argv[2],process.argv[3]);process.exit(2)}catch(error){process.exit(/regular file/.test(error.message)?0:3)}`,
      module,
      path,
      root,
    ],
    { timeout: 1000, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0);
});
