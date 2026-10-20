import { execFileSync } from "node:child_process";
import { dirname } from "node:path";

export function git(repository, args) {
  return execFileSync("git", ["-C", repository, ...args], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      PATH: `${dirname(process.execPath)}:/usr/bin:/bin`,
      HOME: "/dev/null",
      GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_CONFIG_SYSTEM: "/dev/null",
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_NO_REPLACE_OBJECTS: "1",
      GIT_NO_LAZY_FETCH: "1",
      GIT_TERMINAL_PROMPT: "0",
      GIT_CONFIG_COUNT: "3",
      GIT_CONFIG_KEY_0: "core.hooksPath",
      GIT_CONFIG_VALUE_0: "/dev/null",
      GIT_CONFIG_KEY_1: "protocol.allow",
      GIT_CONFIG_VALUE_1: "never",
      GIT_CONFIG_KEY_2: "core.fsmonitor",
      GIT_CONFIG_VALUE_2: "false",
    },
  }).trim();
}
