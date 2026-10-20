import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

/** Injectable process adapter; sensitive deployments never stream provider output. */
export function createCfRunner({
  cliPath,
  root,
  spawnProcess = spawn,
  error = (message) => new Error(message),
}) {
  return function run(
    args,
    { cwd = root, stream = false, settleMs = 0, env = {}, sensitive = false } = {},
  ) {
    if (!existsSync(cliPath)) throw error("The cf CLI isn't installed. Run `pnpm install` first.");
    return new Promise((resolve, reject) => {
      const child = spawnProcess(cliPath, args, {
        cwd,
        env: { ...process.env, ...env },
        stdio: ["inherit", "pipe", "pipe"],
      });
      let output = "";
      let settle;
      let quietStop = false;
      const collect = (target) => (chunk) => {
        output += chunk;
        if (stream && !sensitive) target.write(chunk);
        if (settleMs) {
          clearTimeout(settle);
          settle = setTimeout(() => {
            quietStop = true;
            child.kill();
          }, settleMs);
        }
      };
      child.stdout.on("data", collect(process.stdout));
      child.stderr.on("data", collect(process.stderr));
      child.on("error", () => {
        clearTimeout(settle);
        reject(error(`Could not start cf ${args[0]}.`));
      });
      child.on("close", (code, signal) => {
        clearTimeout(settle);
        if (code === 0 || (signal === "SIGTERM" && settleMs && quietStop)) resolve(output);
        else
          reject(
            error(
              sensitive
                ? `cf ${args[0]} failed. Provider output withheld because it may contain secrets. Inspect the target in your provider console before retrying.`
                : `cf ${args.join(" ")} failed:\n${output.trim().slice(-1500)}`,
            ),
          );
      });
    });
  };
}
