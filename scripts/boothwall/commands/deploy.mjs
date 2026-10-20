import { runDeploy } from "../lib/workflow/index.mjs";

/** Redeploy only resources whose identity matches the validated configuration. */
export const deployAll = (options = {}) => runDeploy(options);
