import { createRequire } from "node:module";
import { join } from "node:path";

import { API_DIR } from "../paths.mjs";

// Resolve the API's declared workspace dependency, also in a standalone install.
const fromApi = createRequire(join(API_DIR, "package.json"));
export const sharedConfig = fromApi("@boothwall/shared/config");
