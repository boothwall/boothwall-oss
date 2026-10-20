import { randomInt } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { DEV_VARS } from "../paths.mjs";
import { assertNotExampleValue, examplePathFor } from "../secrets/index.mjs";

/**
 * The local Control panel passcode (ADMIN_TOKEN in apps/api/.dev.vars). A first run writes a
 * random 8-digit one; later runs keep whatever is there, so a changed passcode stays changed. The
 * example file's placeholder is refused, since anyone can read it.
 */
export function localPasscode(path = DEV_VARS) {
  if (existsSync(path)) {
    const token = readFileSync(path, "utf8")
      .match(/^ADMIN_TOKEN=(.+)$/m)?.[1]
      ?.trim();
    assertNotExampleValue("ADMIN_TOKEN", token, examplePathFor(path));
    if (token && token.length >= 6) return { passcode: token, created: false };
  }
  const passcode = String(randomInt(10_000_000, 100_000_000));
  const kept = existsSync(path)
    ? readFileSync(path, "utf8").replace(/^ADMIN_TOKEN=.*\n?/m, "")
    : "";
  writeFileSync(path, `${kept}ADMIN_TOKEN=${passcode}\n`);
  return { passcode, created: true };
}
