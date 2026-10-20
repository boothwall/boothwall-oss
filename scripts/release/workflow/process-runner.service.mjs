import { spawnSync } from "node:child_process";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

export function buildEnvironment(environment, home) {
  if (!home) throw new Error("Isolated build home required");
  const result = {
    CI: "true",
    HUSKY: "0",
    TZ: "UTC",
    LANG: "C.UTF-8",
    PNPM_ENABLE_PRE_POST_SCRIPTS: "false",
    HOME: home,
    NPM_CONFIG_USERCONFIG: "/dev/null",
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_SYSTEM: "/dev/null",
    GIT_TERMINAL_PROMPT: "0",
  };
  for (const key of ["PATH", "TMPDIR", "TEMP", "TMP", "PNPM_HOME"])
    if (environment[key]) result[key] = environment[key];
  result.PATH ??= `${dirname(process.execPath)}:/usr/bin:/bin`;
  return result;
}
export function processRunner(repository) {
  if (!/^v24\./.test(process.version)) throw new Error("Node 24 required");
  const home = mkdtempSync(join(realpathSync(tmpdir()), "public-build-home-"));
  const env = buildEnvironment(process.env, home);
  const close = () => rmSync(home, { recursive: true, force: true });
  const pnpm = spawnSync("pnpm", ["--version"], { cwd: repository, env, encoding: "utf8" });
  if (pnpm.status !== 0 || pnpm.stdout.trim() !== "10.20.0") {
    close();
    throw new Error("pnpm 10.20.0 required");
  }
  const runner = async ({ command }) => {
    const [name, ...args] = command;
    const result = spawnSync(name === "node" ? process.execPath : name, args, {
      cwd: repository,
      env,
      encoding: "utf8",
      timeout: 20 * 60 * 1000,
      maxBuffer: 32 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (result.error) throw new Error("Public build command could not complete");
    return { status: result.status, stdout: result.stdout, stderr: result.stderr };
  };
  runner.close = close;
  return runner;
}
