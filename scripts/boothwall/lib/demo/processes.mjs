import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout as sleep } from "node:timers/promises";

import { UserError } from "../ui.mjs";

// Dev servers bind any of these, and a bind on one doesn't block the others, so a port is free
// only if all of them are. A machine without IPv6 rejects those addresses outright.
const BIND_ADDRESSES = ["127.0.0.1", "0.0.0.0", "::1", "::"];
const NO_SUCH_ADDRESS = new Set(["EADDRNOTAVAIL", "EAFNOSUPPORT"]);

const bindable = (port, host) =>
  new Promise((resolve) => {
    const server = createServer()
      .once("error", (error) => resolve(NO_SUCH_ADDRESS.has(error.code)))
      .once("listening", () => server.close(() => resolve(true)))
      .listen(port, host);
  });

export async function isPortFree(port) {
  for (const host of BIND_ADDRESSES) if (!(await bindable(port, host))) return false;
  return true;
}

/** The first free port from `start` up, so a second dev server doesn't clash with yours. */
export async function freePort(start) {
  for (let port = start; port < start + 50; port++) if (await isPortFree(port)) return port;
  throw new UserError(`No free port between ${start} and ${start + 49}.`);
}

/**
 * Starts a long-running dev server. Its output is kept, not shown: the demo prints one clean
 * summary, and the last lines only if the server stops on its own.
 */
export function startServer(name, command, args, { cwd, env }) {
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const lines = [];
  const keep = (chunk) => {
    lines.push(...chunk.toString().split("\n").filter(Boolean));
    lines.splice(0, Math.max(0, lines.length - 40));
  };
  child.stdout.on("data", keep);
  child.stderr.on("data", keep);
  const exited = new Promise((resolve) =>
    child.once("exit", (code, signal) => resolve({ code, signal })),
  );
  return { name, child, exited, tail: () => lines.join("\n") };
}

/** Waits until `url` answers, or fails with the server's last output. */
export async function waitUntilUp(url, server, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (server.child.exitCode !== null) break;
    const up = await fetch(url).then(
      (res) => res.status < 500,
      () => false,
    );
    if (up) return;
    await sleep(500);
  }
  throw new UserError(`The ${server.name} didn't start.\n\n${server.tail()}`);
}
