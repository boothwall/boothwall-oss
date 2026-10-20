import qrcode from "qrcode-generator";

import { terminalOutput } from "../ui.mjs";

const paint = (text, code, color) => (color ? `\x1b[${code}m${text}\x1b[0m` : text);
const title = (text, color) => paint(text, 1, color);
const link = (text, color) => paint(text, 96, color);
const muted = (text, color) => paint(text, 2, color);

/** Cosmetic output only: no servers, device discovery or credential reads. */
export function demoIntro({ shared }, { color = false, rich = false } = terminalOutput()) {
  const mark = rich
    ? `${paint("■", 94, color)}${paint("■", 96, color)}${paint("■", 91, color)} `
    : "";
  return `\n${mark}${title("BoothWall", color)}  ${muted(shared ? "LOCAL NETWORK DEMO" : "THIS COMPUTER", color)}
${muted("Bring the room into the picture.", color)}\n`;
}

/** Reuse the QR encoder; four modules of quiet zone, explicit light/dark contrast. */
export function uploadQr(url, columns) {
  const qr = qrcode(0, "M");
  qr.addData(url);
  qr.make();
  const lines = qr.createASCII(1, 4).split("\n");
  if (lines.some((line) => line.length > columns)) return "";
  // createASCII draws LIGHT cells as blocks and DARK cells as spaces.
  // Per-line styling/reset leaves subsequent links independent of terminal theme.
  return lines.map((line) => `\x1b[97;40m${line}\x1b[0m`).join("\n");
}

export function demoReady(
  { webUrl, passcode, created = false, shared = false },
  { color = false, rich = false, columns = 80 } = terminalOutput(),
  qrRenderer = uploadQr,
) {
  const guestUrl = `${webUrl}/snap`;
  let qr = "";
  if (rich && color && shared && columns >= 40) {
    // A presentation failure must never stop a successfully started demo.
    try {
      qr = qrRenderer(guestUrl, columns);
    } catch {
      qr = "";
    }
  }
  const rule = rich ? `${muted("─".repeat(Math.min(columns, 64)), color)}\n` : "";
  return `
${rule}${title("Your wall is ready.", color)}
${muted("1 Send a photo -> 2 Approve it -> 3 Look up", color)}

${title("GUEST · Send a photo", color)}
${link(guestUrl, color)}
${shared ? "Same Wi-Fi as this computer. VPNs, firewalls or guest-network isolation may block access." : "On this computer only. To join from a phone, restart with pnpm demo --lan."}
${qr ? `\nScan to send a photo\n${qr}\n` : ""}
${title("HOST · Review and approve", color)}
${link(`${webUrl}/control`, color)}
Local passcode: ${title(passcode, color)}${created ? muted("  (new, saved in apps/api/.dev.vars)", color) : ""}

${title("DISPLAY · Open on another screen", color)}
${link(`${webUrl}/`, color)}

Open Control to review photos and manage uploads.
${rule}`;
}
