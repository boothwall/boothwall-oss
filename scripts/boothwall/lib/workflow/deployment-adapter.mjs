import { cf } from "../cf.mjs";
import { readConfig, updateConfig } from "../config-file.mjs";
import { DEV_VARS } from "../paths.mjs";
import { bindTarget, readTargetBinding } from "../resources/index.mjs";
import { ensureFingerprintKeyFile, ensureSecretFile } from "../secrets/index.mjs";
import { confirm, log } from "../ui.mjs";

export const deploymentAdapter = {
  run: cf,
  readConfig,
  updateConfig,
  readBinding: readTargetBinding,
  bindTarget,
  ensureSecret: async () => {
    await ensureSecretFile(DEV_VARS);
    await ensureFingerprintKeyFile(DEV_VARS);
  },
  confirm,
  log,
};
