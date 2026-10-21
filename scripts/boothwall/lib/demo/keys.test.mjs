import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { test } from "node:test";

import { copyText, listenForKeys, opener } from "./keys.mjs";

class FakeTty extends EventEmitter {
  isTTY = true;
  raw = false;
  setRawMode(on) {
    this.raw = on;
  }
  setEncoding() {}
  resume() {}
  pause() {}
}

test("shortcuts run on single keys, ignore arrow keys, pass Ctrl+C on and restore the terminal", () => {
  const input = new FakeTty();
  const pressed = [];
  let interrupted = 0;
  const cleanup = listenForKeys(
    { w: () => pressed.push("w"), c: () => pressed.push("c") },
    { input, interrupt: () => interrupted++ },
  );
  assert.equal(input.raw, true);
  input.emit("data", "W");
  input.emit("data", "\x1b[C");
  input.emit("data", "x");
  input.emit("data", "\u0003");
  assert.deepEqual(pressed, ["w"]);
  assert.equal(interrupted, 1);
  cleanup();
  cleanup();
  assert.equal(input.raw, false);
  input.emit("data", "c");
  assert.deepEqual(pressed, ["w"]);
  assert.equal(typeof listenForKeys({}, { input: { isTTY: false } }), "function");
});

test("the passcode goes to the clipboard through stdin, trying each helper in turn", async () => {
  const calls = [];
  const copied = await copyText("example-local-code", "linux", async (command, args, options) => {
    calls.push({ command, args, options });
    return command === "xclip";
  });
  assert.equal(copied, true);
  assert.deepEqual(
    calls.map(({ command }) => command),
    ["wl-copy", "xclip"],
  );
  assert.ok(
    calls.every(
      ({ args, options }) =>
        !args.includes("example-local-code") && options.input === "example-local-code",
    ),
  );
  assert.equal(await copyText("x", "plan9", async () => true), false);
  assert.deepEqual(opener("http://a/", "darwin"), ["open", ["http://a/"]]);
});
