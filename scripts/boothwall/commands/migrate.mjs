import { runMigration } from "../lib/workflow/index.mjs";

/** Local is explicit; remote migrations require the same target checks as deployment. */
export const migrate = (options = {}) => runMigration(options);
