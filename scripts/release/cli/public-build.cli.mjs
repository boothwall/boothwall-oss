import { appendFileSync } from "node:fs";

import { readReceipt } from "../artifacts/index.mjs";
import { buildPublic } from "../workflow/index.mjs";

const [command, ...args] = process.argv.slice(2);
try {
  if (command === "verify" && args.length === 2) {
    const packet = readReceipt(args[0], args[1]);
    process.stdout.write(`${JSON.stringify({ digest: packet.digest, receipt: packet.receipt })}\n`);
  } else if (command === "build" && args.length === 0) {
    const env = process.env;
    const request = {
      repository: env.PUBLIC_SOURCE_DIRECTORY,
      commit: env.PUBLIC_COMMIT,
      tree: env.PUBLIC_TREE,
      base: env.PUBLIC_BASE,
      version: env.PUBLIC_VERSION,
      phase: env.PUBLIC_PHASE,
      output: env.PUBLIC_RECEIPT_DIRECTORY,
    };
    if (request.phase === "final")
      Object.assign(request, {
        branchCommit: env.PUBLIC_BRANCH_COMMIT,
        branchReceipt: env.PUBLIC_BRANCH_RECEIPT,
        branchDigest: env.PUBLIC_BRANCH_DIGEST,
      });
    const packet = await buildPublic(request);
    if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `receipt-digest=${packet.digest}\n`);
    process.stdout.write(`${JSON.stringify({ digest: packet.digest, publishable: false })}\n`);
  } else throw new Error("Use verify <packet> <digest>, or explicit build with PUBLIC_* inputs");
} catch (error) {
  // Do not print command output, environment values or local paths in public logs.
  process.stderr.write(
    `${error instanceof Error && /^(Public check failed:|Use verify)/.test(error.message) ? error.message : "Public build verification failed"}\n`,
  );
  process.exitCode = 1;
}
