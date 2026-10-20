import assert from "node:assert/strict";
import { test } from "node:test";
import { stripVTControlCharacters } from "node:util";

import { terminalOutput } from "../ui.mjs";
import { demoIntro, demoReady, uploadQr } from "./welcome.mjs";

const example = {
  webUrl: "http://192.0.2.42:5184",
  passcode: "example-local-code",
  shared: true,
};
const plain = { rich: false, color: false, columns: 80 };
const rich = { rich: true, color: true, columns: 80 };
const strip = stripVTControlCharacters;

test("the ready screen keeps actual ports and separates guest, host and display", () => {
  const text = demoReady(example, plain);
  assert.match(text, /1 Send a photo -> 2 Approve it -> 3 Look up/);
  for (const path of ["/snap", "/control", "/"])
    assert.ok(text.includes(`${example.webUrl}${path}`));
  assert.ok(text.indexOf("/snap") < text.indexOf("/control"));
  assert.match(text, /Same Wi-Fi/);
  assert.match(text, /Local passcode: example-local-code/);
  assert.ok(!text.includes("\x1b"));
  assert.doesNotMatch(text, /[█▀▄]|TV.*connected|https:\/\//);
});

test("only the guest URL is handed to the QR encoder, never host credentials", () => {
  const encoded = [];
  const text = demoReady(example, rich, (url) => {
    encoded.push(url);
    return "QR";
  });
  assert.deepEqual(encoded, [`${example.webUrl}/snap`]);
  assert.match(text, /QR/);
  assert.match(text, /Scan to send a photo/);
});

test("plain and very narrow terminals keep copyable URLs without attempting QR", () => {
  for (const options of [plain, { ...rich, columns: 24 }]) {
    const text = demoReady(example, options, () => {
      throw new Error("QR must be skipped");
    });
    assert.ok(text.includes(`${example.webUrl}/snap`));
    assert.doesNotMatch(text, /Scan to send/);
  }
});

test("localhost mode explains phone access and omits a non-routable guest QR", () => {
  const text = demoReady(
    { ...example, webUrl: "http://localhost:5173", shared: false },
    rich,
    () => {
      throw new Error("No localhost phone QR");
    },
  );
  assert.match(text, /pnpm demo --lan/);
  assert.doesNotMatch(text, /Same Wi-Fi|Scan to send/);
});

test("the saved-passcode hint appears only when a passcode was created", () => {
  assert.match(
    demoReady({ ...example, created: true }, plain),
    /new, saved in apps\/api\/\.dev\.vars/,
  );
  assert.doesNotMatch(demoReady(example, plain), /new, saved/);
});

test("a QR encoding failure falls back to the full URL without hiding readiness", () => {
  const text = demoReady(example, rich, () => {
    throw new Error("encoding failed");
  });
  assert.match(text, /Your wall is ready/);
  assert.ok(text.includes(`${example.webUrl}/snap`));
  assert.doesNotMatch(text, /Scan to send/);
});

test("real QR output preserves its quiet zone, contrast and width budget", () => {
  const qr = uploadQr(`${example.webUrl}/snap`, 80);
  assert.ok(qr.includes("\x1b[97;40m"));
  const lines = strip(qr).split("\n");
  assert.ok(lines.length > 10);
  assert.ok(lines.every((line) => line.length <= 80 && /^[█▀▄ ]+$/.test(line)));
  assert.ok(lines[0].startsWith("████"));
  assert.equal(uploadQr(`${example.webUrl}/snap`, 12), "");
});

test("intro identifies the mode without making unverified readiness claims", () => {
  const text = demoIntro({ shared: true }, plain);
  assert.match(text, /BoothWall.*LOCAL NETWORK DEMO/);
  assert.doesNotMatch(text, /ready|✓|connected/i);
  assert.match(demoIntro({ shared: false }, plain), /THIS COMPUTER/);
});

test("rich output requires a capable terminal; NO_COLOR and CI stay plain", () => {
  assert.deepEqual(terminalOutput({ isTTY: true, columns: 100, env: {} }), {
    rich: true,
    color: true,
    columns: 100,
  });
  for (const env of [{ NO_COLOR: "1" }, { TERM: "dumb" }, { CI: "true" }]) {
    assert.equal(terminalOutput({ isTTY: true, columns: 80, env }).rich, false);
    assert.equal(terminalOutput({ isTTY: true, columns: 80, env }).color, false);
  }
  assert.equal(terminalOutput({ isTTY: false, env: {} }).rich, false);
  assert.equal(terminalOutput({ isTTY: true, columns: 24, env: {} }).rich, false);
  assert.equal(terminalOutput({ isTTY: true, env: {} }).columns, 80);
});
