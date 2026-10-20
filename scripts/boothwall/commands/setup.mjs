import { runSetup } from "../lib/workflow/index.mjs";

/** Validate and confirm a pinned account/resource target, then safely create or resume it. */
export const setup = (options = {}) => runSetup(options);
