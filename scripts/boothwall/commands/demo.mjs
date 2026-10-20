import { relative } from "node:path";

import { overrideConfig } from "../lib/demo/config-override.mjs";
import { lanAddress } from "../lib/demo/network.mjs";
import { localPasscode } from "../lib/demo/passcode.mjs";
import { freePort, startServer, waitUntilUp } from "../lib/demo/processes.mjs";
import { seedLocalWall, seedStatusMessage } from "../lib/demo/seed.mjs";
import { buildAndOpenOnVirtualDevice, vegaCli, virtualDeviceRunning } from "../lib/demo/tv.mjs";
import { API_DIR, CF, CONFIG_FILE, DEV_VARS, ROOT, VITE, WEB_DIR } from "../lib/paths.mjs";
import { ensureFingerprintKeyFile } from "../lib/secrets/index.mjs";
import { bold, dim, log, ok, step, UserError } from "../lib/ui.mjs";
import { migrate } from "./migrate.mjs";

const CONFIG = relative(ROOT, CONFIG_FILE);

/**
 * `pnpm demo`: the whole wall on this machine, no Cloudflare account needed. Applies the local
 * migrations, starts the API and the web app pointed at it, fills a fresh wall with demo photos
 * and prints the addresses and the Control panel passcode. Ctrl+C stops both.
 * `--lan` serves both on this machine's network address for phones, a Fire TV and the Virtual Device.
 * `--tv` (`pnpm try`) also points the config's `urls` at them while it runs and opens the TV app
 * on the Vega Virtual Device when one is running.
 */
export async function demo({ lan = false, tv = false } = {}) {
  const shared = lan || tv;
  const host = shared ? lanAddress() : "localhost";
  if (!host)
    throw new UserError("--lan needs a network connection, and this machine has no IPv4 address.");
  // The API's vite.config.ts reads BOOTHWALL_DEMO_LAN; vite for the web app takes --host.
  const webBind = shared ? ["--host", "0.0.0.0"] : [];
  const self = shared ? "127.0.0.1" : "localhost";

  const apiPort = await freePort(8787);
  const webPort = await freePort(5173);
  const apiUrl = `http://${host}:${apiPort}`;
  const webUrl = `http://${host}:${webPort}`;

  const { passcode, created } = localPasscode();
  await ensureFingerprintKeyFile(DEV_VARS);
  await migrate({ local: true });

  // Before the servers start, because both read the config as they start.
  const restoreConfig = tv
    ? overrideConfig([
        ["urls.api", apiUrl],
        ["urls.web", webUrl],
        ["demo", false],
      ])
    : () => true;
  const servers = [];
  let stopping = false;
  const stop = () => {
    stopping = true;
    servers.forEach(({ child }) => child.exitCode === null && child.kill());
    if (!restoreConfig()) log(dim(`${CONFIG} changed while the demo ran, so it stays as it is.`));
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  try {
    step("Starting the API");
    const api = startServer("API", CF, ["dev", "--port", String(apiPort)], {
      cwd: API_DIR,
      env: shared ? { BOOTHWALL_DEMO_LAN: "1" } : {},
    });
    servers.push(api);
    await waitUntilUp(`http://${self}:${apiPort}/health`, api);
    ok(`API on ${apiUrl}`);

    step("Filling the wall");
    const seed = await seedLocalWall(`http://${self}:${apiPort}`, passcode);
    ok(seedStatusMessage(seed));

    step("Starting the web app");
    const web = startServer(
      "web app",
      VITE,
      ["--port", String(webPort), "--strictPort", ...webBind],
      {
        cwd: WEB_DIR,
        env: { VITE_API_URL: apiUrl },
      },
    );
    servers.push(web);
    await waitUntilUp(`http://${self}:${webPort}`, web);
    ok(`Web app on ${webUrl}`);
  } catch (error) {
    stop();
    throw error;
  }

  log(`
${bold("BoothWall is running.")}

  Display        ${webUrl}/        ${dim("the live photo wall")}
  Upload page    ${webUrl}/snap
  Control panel  ${webUrl}/control   passcode ${bold(passcode)}${created ? dim("  (new, saved in apps/api/.dev.vars)") : ""}

Open Control to review photos and manage uploads.${lan && !tv ? tvHint(apiUrl, webUrl) : ""}`);

  if (tv) await openOnTv();
  log("Press Ctrl+C to stop.");

  const { server, code, signal } = await Promise.race(
    servers.map((server) => server.exited.then((exit) => ({ server, ...exit }))),
  );
  const requested = stopping;
  stop();
  if (!requested && !signal && code !== 0)
    throw new UserError(`The ${server.name} stopped.\n\n${server.tail()}`);
}

/** The Vega app takes its API from the config at build time. */
const tvHint = (apiUrl, webUrl) => `

${bold("On a Fire TV or the Vega Virtual Device")} (same network), set in ${CONFIG}:
  urls: { api: "${apiUrl}", web: "${webUrl}", ... }
then ${dim("pnpm tv:build:debug && pnpm tv:run:vvd")} (or ${dim("vega run-app … -d <device>")}).`;

async function openOnTv() {
  log(dim(`\n${CONFIG} points at this machine until you stop the demo.`));
  const cli = vegaCli();
  if (!(await virtualDeviceRunning(cli))) {
    log(`
${bold("For the Fire TV app")}, start the Vega Virtual Device (${dim("pnpm tv:vvd:start:1080")}), then run
${dim("pnpm tv:build:debug && pnpm tv:run:vvd")}. The config already points the build at this wall.`);
    return;
  }
  step("Building the TV app and opening it on the Vega Virtual Device");
  try {
    await buildAndOpenOnVirtualDevice(cli);
    ok("The wall is on the Virtual Device. Hold OK there for a photo call.");
  } catch (error) {
    log(`The TV app didn't open: ${error.message}
Try ${dim("pnpm tv:build:debug && pnpm tv:run:vvd")}.`);
  }
}
