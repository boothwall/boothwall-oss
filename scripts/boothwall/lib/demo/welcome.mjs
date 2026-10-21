import qrcode from "qrcode-generator";

import { terminalOutput } from "../ui.mjs";
import { besides, centre, painter, visibleWidth } from "./style.mjs";

const GAP = 4;

/** Cosmetic output only: no servers, device discovery or credential reads. */
export function demoIntro({ shared }, output = terminalOutput()) {
  const s = painter(output);
  const mark = output.rich ? `${s.accent("✦")} ` : "";
  const pill = output.color ? s.pill(" OSS ") : "OSS";
  const mode = shared ? "local network demo" : "on this computer";
  return `\n${mark}${s.bold("Booth")}${s.accent("Wall")} ${pill}  ${s.dim(`· ${mode}`)}
${s.dim("Bring the room into the picture.")}\n`;
}

/** The guest URL as terminal blocks: low error correction keeps it small, two modules of quiet zone. */
export function uploadQr(url, columns) {
  const qr = qrcode(0, "L");
  qr.addData(url);
  qr.make();
  const lines = qr.createASCII(1, 2).split("\n");
  if (lines.some((line) => line.length > columns)) return [];
  // createASCII draws LIGHT cells as blocks and DARK cells as spaces; explicit colours keep the
  // contrast on light and dark themes, and the per-line reset keeps the next column unstyled.
  return lines.map((line) => `\x1b[97;40m${line}\x1b[0m`);
}

function roles({ webUrl, passcode, created, shared }, s) {
  const role = (number, name, action) =>
    `${s.accent(number)}  ${s.accent(name.padEnd(5))}  ${s.bold(action)}`;
  return [
    role("1", "GUEST", "Send a photo"),
    `   ${s.link(`${webUrl}/snap`)}`,
    `   ${s.dim(shared ? "Phones on the same Wi-Fi as this computer" : "On this computer only")}`,
    "",
    role("2", "HOST", "Approve it"),
    `   ${s.link(`${webUrl}/control`)}`,
    `   Passcode  ${s.bold(passcode)}${created ? s.dim("  new, saved in apps/api/.dev.vars") : ""}`,
    "",
    role("3", "WALL", "Look up"),
    `   ${s.link(`${webUrl}/`)}`,
  ];
}

/** Guest QR beside the three roles when it fits, under the guest's link when it doesn't. */
function layout(steps, qr, columns, s) {
  if (qr.length === 0) return steps;
  const caption = "Scan to send a photo";
  const qrWidth = visibleWidth(qr[0]);
  const stepsWidth = Math.max(...steps.map(visibleWidth));
  if (qrWidth + GAP + stepsWidth <= columns)
    return besides([...qr, "", centre(s.dim(caption), qrWidth)], steps, GAP);
  return [
    ...steps.slice(0, 3),
    "",
    `   ${s.dim(caption)}`,
    ...qr.map((line) => `   ${line}`),
    ...steps.slice(3),
  ];
}

/** Items joined on as few lines as the width allows. */
function wrap(items, separator, columns) {
  const lines = [];
  for (const item of items) {
    const last = lines.at(-1);
    if (last && visibleWidth(last + separator + item) <= columns)
      lines[lines.length - 1] += separator + item;
    else lines.push(item);
  }
  return lines;
}

/**
 * The ready card. `keys` are [key, label] pairs, shown only while shortcuts are listening;
 * `readyMs` is the measured startup time.
 */
export function demoReady(
  info,
  output = terminalOutput(),
  { qrRenderer = uploadQr, keys = [] } = {},
) {
  const s = painter(output);
  const { rich, color, columns } = output;
  let qr = [];
  if (rich && color && info.shared) {
    // A presentation failure must never stop a successfully started demo.
    try {
      qr = qrRenderer(`${info.webUrl}/snap`, columns - 3);
    } catch {
      qr = [];
    }
  }
  const took = Number.isFinite(info.readyMs)
    ? s.dim(`  ready in ${(info.readyMs / 1000).toFixed(1)}s`)
    : "";
  const note = info.shared
    ? s.dim("VPNs, firewalls or guest-network isolation can keep phones out.")
    : `For phones, restart with ${s.bold("pnpm demo --lan")}.`;
  const body = [...layout(roles(info, s), qr, columns, s), "", note];
  // Dividers as wide as the card itself, never wider than the terminal.
  const width = Math.min(columns, Math.max(...body.map(visibleWidth)));
  const shortcuts = wrap(
    keys.map(([key, label]) => `${s.accent(key)} ${label}`),
    "   ",
    width,
  );
  const rule = rich ? [s.dim("─".repeat(width))] : [];
  return [
    "",
    ...rule,
    `${rich ? `${s.accent("✦")} ` : ""}${s.bold("Your wall is live.")}${took}`,
    "",
    ...body,
    ...rule,
    ...shortcuts,
  ].join("\n");
}
