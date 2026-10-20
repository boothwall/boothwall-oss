import { randomBytes } from "node:crypto";
import {
  closeSync,
  constants,
  fchmodSync,
  fstatSync,
  fsyncSync,
  ftruncateSync,
  openSync,
  readFileSync,
  writeSync,
} from "node:fs";

import { askHidden, UserError } from "../ui.mjs";
import { assignments, normalizeLines } from "./dotenv-assignments.mjs";
import { assertNotExampleValue, examplePathFor } from "./example-values.mjs";

const valid = (token, minLength) =>
  typeof token === "string" &&
  token.length >= minLength &&
  /^[A-Za-z0-9_!@%+=:.,/-]{12,256}$/.test(token);

function openPrivate(path, create = false) {
  try {
    const fd = openSync(
      path,
      constants.O_RDWR | constants.O_NOFOLLOW | (create ? constants.O_CREAT | constants.O_EXCL : 0),
      0o600,
    );
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.nlink !== 1) {
      closeSync(fd);
      throw new UserError("Secret storage must be a regular, unshared file.");
    }
    return fd;
  } catch (error) {
    if (error.code === "ELOOP") throw new UserError("Secret storage must not be a symbolic link.");
    throw error;
  }
}

/**
 * The one assignment's state: absent, empty (the example's blank line, filled in place) or kept.
 * Refuses anything ambiguous, weak or published rather than replacing it.
 */
function existingSecret(source, name, minLength, examplePath) {
  const found = assignments(source, name);
  if (!found.length) return { state: "absent" };
  const token = found[0].value;
  if (found.length === 1 && token === "") return { state: "empty", line: found[0] };
  // Existing quoted values may contain punctuation that would need escaping on a new write.
  // Keep their exact source bytes; only new credentials use the narrower write-safe alphabet.
  if (
    found.length !== 1 ||
    token.length < minLength ||
    token.length > 256 ||
    [...token].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
  )
    throw new UserError(
      `Existing ${name === "ADMIN_TOKEN" ? "Control passcode" : "client fingerprint key"} is ambiguous or unsafe. Back up .dev.vars and explicitly set one ${minLength}–256 character value; setup never replaces it.`,
    );
  assertNotExampleValue(name, token, examplePath);
  return { state: "kept" };
}

function inspect(path, name, minLength, examplePath) {
  let fd;
  try {
    fd = openPrivate(path);
    if (existingSecret(readFileSync(fd, "utf8"), name, minLength, examplePath).state === "kept") {
      fchmodSync(fd, 0o600);
      return true;
    }
    return false;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

/** Keeps every other line; never logs or returns a credential. */
async function ensureNamedSecretFile(
  path,
  {
    name = "ADMIN_TOKEN",
    minLength = 12,
    askSecret = () => askHidden("  Control passcode (12+ characters, Enter to generate): "),
    generateSecret = () => randomBytes(24).toString("base64url"),
    examplePath = examplePathFor(path),
  } = {},
) {
  if (inspect(path, name, minLength, examplePath)) return { created: false };
  const token = (await askSecret()) || generateSecret();
  if (!valid(token, minLength))
    throw new UserError(
      `Use a ${minLength}–256 character secret with letters, digits or safe punctuation; no whitespace, quotes, backslashes or #/$ characters.`,
    );
  let fd;
  try {
    fd = openPrivate(path, true);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    fd = openPrivate(path);
  }
  try {
    const source = readFileSync(fd, "utf8");
    const existing = existingSecret(source, name, minLength, examplePath);
    fchmodSync(fd, 0o600);
    if (existing.state === "kept") return { created: false };
    if (existing.state === "empty") {
      const text = normalizeLines(source);
      const filled = `${text.slice(0, existing.line.start)}${name}=${token}${text.slice(existing.line.end)}`;
      ftruncateSync(fd, 0);
      writeSync(fd, filled, 0);
    } else
      writeSync(
        fd,
        `${source && !source.endsWith("\n") ? "\n" : ""}${name}=${token}\n`,
        Buffer.byteLength(source),
      );
    fsyncSync(fd);
    return { created: true };
  } finally {
    closeSync(fd);
  }
}

export const ensureSecretFile = (path, options = {}) =>
  ensureNamedSecretFile(path, { ...options, name: "ADMIN_TOKEN", minLength: 12 });

/** Separate random server key; never shown to the Control user or returned to the caller. */
export const ensureFingerprintKeyFile = (path, options = {}) =>
  ensureNamedSecretFile(path, {
    ...options,
    name: "CLIENT_FINGERPRINT_KEY",
    minLength: 32,
    askSecret: async () => "",
    generateSecret: options.generateSecret ?? (() => randomBytes(32).toString("base64url")),
  });
