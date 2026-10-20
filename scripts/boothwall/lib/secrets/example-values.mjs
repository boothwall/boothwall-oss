import { existsSync, readFileSync } from "node:fs";

import { UserError } from "../ui.mjs";
import { assignments } from "./dotenv-assignments.mjs";

/** Values that earlier example files shipped; anyone could read them in the repository. */
const PUBLISHED_PLACEHOLDERS = new Set(["change-me-to-a-long-random-string"]);

const LABELS = {
  ADMIN_TOKEN: "Control passcode",
  CLIENT_FINGERPRINT_KEY: "client fingerprint key",
};

/** The example file beside a secrets file: `.dev.vars` → `.dev.vars.example`. */
export const examplePathFor = (path) => `${path}.example`;

/** Refuses a secret that is a published placeholder or the value its example file ships. */
export function assertNotExampleValue(name, value, examplePath) {
  const shipped =
    examplePath && existsSync(examplePath)
      ? assignments(readFileSync(examplePath, "utf8"), name).map((found) => found.value)
      : [];
  if (PUBLISHED_PLACEHOLDERS.has(value) || (value && shipped.includes(value)))
    throw new UserError(
      `The ${LABELS[name] ?? name} in .dev.vars is the example's placeholder, which anyone can read. Replace it with your own value, or leave it empty to have one generated.`,
    );
}
