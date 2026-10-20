import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join } from "node:path";

import { TV_DIR } from "../paths.mjs";

const APP = "com.boothwall.app.main";
const DEVICE = "VirtualDevice";
const BUILD_TIMEOUT_MS = 10 * 60_000;
/** Build logs run long; execFile kills a command whose output outgrows its buffer. */
const OUTPUT_LIMIT = 64 * 1024 * 1024;

/** The Vega CLI: the SDK's default install, else whatever `vega` is on the PATH. */
export function vegaCli(home = homedir(), exists = existsSync) {
  const installed = join(home, "vega", "bin", "vega");
  return exists(installed) ? installed : "vega";
}

/** The debug package the Virtual Device on this machine runs. */
export function debugPackage(arch = process.arch) {
  const target = arch === "arm64" ? "aarch64" : "x86_64";
  return join(TV_DIR, "build", `${target}-debug`, `tv_${target}.vpkg`);
}

const run = (command, args, options = {}) =>
  new Promise((resolve, reject) =>
    execFile(
      command,
      args,
      { timeout: 60_000, maxBuffer: OUTPUT_LIMIT, ...options },
      (error, stdout, stderr) =>
        error ? reject(new Error((stderr || error.message).trim())) : resolve(stdout),
    ),
  );

export async function virtualDeviceRunning(cli) {
  const devices = await run(cli, ["device", "list"]).catch(() => "");
  return devices.split("\n").some((line) => line.startsWith(`${DEVICE} : `));
}

/**
 * Builds the TV app against the config as it is now and opens it on the Virtual Device. It
 * launches twice: Vega only routes media keys and Alexa to an app from its second launch.
 */
export async function buildAndOpenOnVirtualDevice(cli) {
  await run("pnpm", ["build:debug"], {
    cwd: TV_DIR,
    timeout: BUILD_TIMEOUT_MS,
    env: isAbsolute(cli)
      ? { ...process.env, PATH: `${dirname(cli)}:${process.env.PATH}` }
      : process.env,
  });
  await run(cli, ["run-app", debugPackage(), APP, "-d", DEVICE]);
  await run(cli, ["device", "terminate-app", "--appName", APP, "-d", DEVICE]);
  await run(cli, ["device", "launch-app", "--appName", APP, "-d", DEVICE]);
}
