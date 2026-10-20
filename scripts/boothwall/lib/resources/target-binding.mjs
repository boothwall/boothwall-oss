import { closeSync, constants, fstatSync, openSync, readFileSync, writeFileSync } from "node:fs";

import { DEV_VARS } from "../paths.mjs";
import { UserError } from "../ui.mjs";

const bindingPath = `${DEV_VARS}.setup.json`;
function validate(value) {
  if (
    value?.schemaVersion !== 1 ||
    !/^[a-f0-9]{32}$/i.test(value.accountId ?? "") ||
    !/^[a-z0-9][a-z0-9-]{1,40}$/.test(value.name ?? "") ||
    Object.keys(value).length !== 3
  )
    throw new UserError(
      "Invalid setup target record. Keep the record and verify your intended account/resources before retrying.",
    );
  return value;
}

export function readTargetBinding(path = bindingPath) {
  let fd;
  try {
    fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.nlink !== 1) throw Error("Not a private file");
    return validate(JSON.parse(readFileSync(fd, "utf8")));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw new UserError(
      "Cannot read the setup target record safely. Verify it before retrying; no target was changed.",
    );
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

export function assertTargetBinding(existing, expected) {
  if (
    existing &&
    (validate(existing).accountId !== expected.accountId || existing.name !== expected.name)
  )
    throw new UserError(
      "This checkout is bound to another setup target. Keep its data and record; use a separate checkout for another account or wall.",
    );
}

export function bindTarget(binding, path = bindingPath) {
  validate(binding);
  const existing = readTargetBinding(path);
  assertTargetBinding(existing, binding);
  if (existing) return;
  try {
    writeFileSync(path, `${JSON.stringify(binding, null, 2)}\n`, { flag: "wx", mode: 0o600 });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    assertTargetBinding(readTargetBinding(path), binding);
  }
}
