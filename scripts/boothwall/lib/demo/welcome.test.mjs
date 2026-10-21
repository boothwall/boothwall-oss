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
const rich = { rich: true, color: true, columns: 100 };
const strip = stripVTControlCharacters;
const fakeQr = () => Array.from({ length: 15 }, () => "#".repeat(29));

test("the ready card keeps actual ports and orders guest, host and wall", () => {
  const text = demoReady({ ...example, readyMs: 4870 }, plain);
  const at = (path) => text.indexOf(`${example.webUrl}${path}\n`);
  assert.ok(at("/snap") > 0 && at("/snap") < at("/control") && at("/control") < at("/"));
  assert.match(
    text,
    /1 {2}GUEST {2}Send a photo[\s\S]*2 {2}HOST {3}Approve it[\s\S]*3 {2}WALL {3}Look up/,
  );
  assert.match(text, /Passcode {2}example-local-code/);
  assert.match(text, /Phones on the same Wi-Fi/);
  assert.match(text, /ready in 4\.9s/);
  assert.ok(!text.includes("\x1b"));
  assert.doesNotMatch(text, /[█▀▄]|https:\/\//);
});

test("only the guest URL is handed to the QR encoder, never host credentials", () => {
  const encoded = [];
  demoReady(example, rich, {
    qrRenderer: (url) => {
      encoded.push(url);
      return fakeQr();
    },
  });
  assert.deepEqual(encoded, [`${example.webUrl}/snap`]);
});

test("a wide terminal puts the QR beside the roles; a narrower one stacks it, URLs whole", () => {
  const wide = strip(demoReady(example, rich, { qrRenderer: fakeQr })).split("\n");
  assert.ok(wide.some((line) => /^#{29} {4}\S/.test(line)));
  assert.ok(wide.every((line) => line.length <= rich.columns));

  const narrow = strip(demoReady(example, { ...rich, columns: 60 }, { qrRenderer: fakeQr }));
  assert.ok(narrow.indexOf("Scan to send") > narrow.indexOf("/snap"));
  assert.ok(narrow.indexOf("Scan to send") < narrow.indexOf("/control"));
  for (const path of ["/snap", "/control", "/"])
    assert.ok(narrow.includes(`${example.webUrl}${path}`));
});

test("localhost and plain output keep copyable URLs without a QR", () => {
  const never = () => {
    throw new Error("QR must be skipped");
  };
  const local = demoReady({ ...example, webUrl: "http://localhost:5173", shared: false }, rich, {
    qrRenderer: never,
  });
  assert.match(local, /pnpm demo --lan/);
  assert.doesNotMatch(local, /same Wi-Fi|Scan to send/);
  assert.doesNotMatch(demoReady(example, plain, { qrRenderer: never }), /Scan to send/);
});

test("a QR failure falls back to the full URL without hiding readiness", () => {
  const text = demoReady(example, rich, {
    qrRenderer: () => {
      throw new Error("encoding failed");
    },
  });
  assert.match(text, /Your wall is live/);
  assert.ok(text.includes(`${example.webUrl}/snap`));
  assert.doesNotMatch(text, /Scan to send/);
});

test("the saved-passcode hint and the shortcuts appear only when they apply", () => {
  assert.match(
    demoReady({ ...example, created: true }, plain),
    /new, saved in apps\/api\/\.dev\.vars/,
  );
  assert.doesNotMatch(demoReady(example, plain), /new, saved|quit/);
  const keys = [
    ["w", "wall"],
    ["c", "Control"],
    ["q", "quit"],
  ];
  const lines = strip(demoReady(example, { ...rich, columns: 18 }, { keys })).split("\n");
  assert.deepEqual(lines.slice(-2), ["w wall   c Control", "q quit"]);
});

test("real QR output is compact, keeps its quiet zone and contrast, and respects the width", () => {
  const qr = uploadQr("http://192.168.178.123:5173/snap", 80);
  const lines = qr.map(strip);
  assert.ok(qr.every((line) => line.startsWith("\x1b[97;40m")));
  assert.ok(lines.length > 10 && lines.length <= 19);
  assert.ok(lines.every((line) => line.length === lines[0].length && line.length <= 37));
  assert.ok(lines[0].startsWith("██") && /^[█▀▄ ]+$/.test(lines.join("")));
  assert.deepEqual(uploadQr(`${example.webUrl}/snap`, 12), []);
});

test("intro shows the OSS lockup and mode without claiming readiness", () => {
  const text = demoIntro({ shared: true }, plain);
  assert.match(text, /BoothWall OSS {2}· local network demo/);
  assert.doesNotMatch(text, /ready|live|✓/i);
  assert.match(demoIntro({ shared: false }, plain), /on this computer/);
  const lockup = demoIntro({ shared: true }, rich);
  assert.ok(
    ["\x1b[1;38;2;217;69;43mWall", "\x1b[1;38;5;167mWall"].some((wall) => lockup.includes(wall)),
  );
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
