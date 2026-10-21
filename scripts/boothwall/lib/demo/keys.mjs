import { spawn } from "node:child_process";
import { stdin } from "node:process";

/** The platform's "open this in the browser" command. */
export function opener(url, platform = process.platform) {
  if (platform === "darwin") return ["open", [url]];
  if (platform === "win32") return ["cmd", ["/c", "start", "", url]];
  return ["xdg-open", [url]];
}

const CLIPBOARDS = {
  darwin: [["pbcopy", []]],
  win32: [["clip", []]],
  linux: [
    ["wl-copy", []],
    ["xclip", ["-selection", "clipboard"]],
  ],
};

/** Runs a helper quietly; `input` goes to its stdin, never its arguments. True when it worked. */
export function launch(command, args, { input } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: [input === undefined ? "ignore" : "pipe", "ignore", "ignore"],
    });
    child.once("error", () => resolve(false));
    child.once("close", (code) => resolve(code === 0));
    if (input !== undefined) child.stdin.end(input);
  });
}

export async function copyText(text, platform = process.platform, run = launch) {
  for (const [command, args] of CLIPBOARDS[platform] ?? [])
    if (await run(command, args, { input: text })) return true;
  return false;
}

/**
 * Single-key shortcuts while the demo runs. Raw mode swallows Ctrl+C, so it is passed on to
 * `interrupt`. Arrow and function keys arrive as escape sequences and are ignored, so they can't
 * trigger letters. Returns the cleanup; a non-interactive stdin gets none of this.
 */
export function listenForKeys(
  actions,
  { input = stdin, interrupt = () => process.kill(process.pid, "SIGINT") } = {},
) {
  if (!input.isTTY || typeof input.setRawMode !== "function") return () => {};
  const onData = (chunk) => {
    const keys = String(chunk);
    if (keys.startsWith("\x1b")) return;
    for (const key of keys) {
      if (key === "\u0003") interrupt();
      else actions[key.toLowerCase()]?.();
    }
  };
  input.setRawMode(true);
  input.setEncoding("utf8");
  input.on("data", onData);
  input.resume();
  let listening = true;
  return () => {
    if (!listening) return;
    listening = false;
    input.off("data", onData);
    input.setRawMode(false);
    input.pause();
  };
}
