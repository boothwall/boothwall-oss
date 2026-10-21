import assert from "node:assert/strict";
import { test } from "node:test";
import { setTimeout as sleep } from "node:timers/promises";

import { describeEvent, describePending, startLiveFeed } from "./live.mjs";

test("guest captions cannot steer the terminal and long ones are cut", () => {
  const line = describeEvent({
    type: "photo.created",
    photo: { caption: "Hi\x1b]52;c;ZXZpbA==\x07\x1b[2J there" },
  });
  assert.equal(line.tone, "good");
  assert.ok([...line.text].every((char) => char.codePointAt(0) >= 0x20));
  const long = describeEvent({ type: "photo.created", photo: { caption: "x".repeat(200) } });
  assert.ok(long.text.length < 80);
  assert.equal(
    describeEvent({ type: "photo.created", photo: { caption: null } }).text,
    "A photo is on the wall",
  );
  assert.equal(describeEvent({ type: "photo.reactions" }), null);
  assert.equal(describeEvent("garbage"), null);
});

test("pending photos are announced only when the count goes up", () => {
  assert.equal(describePending(undefined, { pending: 3 }), null);
  assert.match(describePending({ pending: 0 }, { pending: 1 }).text, /^A new photo is waiting/);
  assert.match(describePending({ pending: 1 }, { pending: 3 }).text, /^2 new photos are waiting/);
  assert.equal(describePending({ pending: 2 }, { pending: 1 }), null);
});

test("the feed reports uploads and approvals, sends the passcode only as a header, and goes quiet on stop", async () => {
  const counts = [{ pending: 0 }, { pending: 1 }, { pending: 1 }];
  const requests = [];
  const fetchImpl = async (url, init) => {
    requests.push({ url, init });
    return { ok: true, json: async () => counts[Math.min(requests.length - 1, counts.length - 1)] };
  };
  const sockets = [];
  class Socket extends EventTarget {
    constructor(url) {
      super();
      this.url = url;
      sockets.push(this);
    }
    close() {
      this.closed = true;
    }
  }
  const printed = [];
  const stop = startLiveFeed({
    apiUrl: "http://127.0.0.1:8787",
    passcode: "example-local-code",
    print: (line) => printed.push(line.text),
    intervalMs: 5,
    fetchImpl,
    Socket,
  });
  await sleep(30);
  const approved = new Event("message");
  approved.data = JSON.stringify({ type: "photo.created", photo: { caption: "Booth crew" } });
  sockets[0].dispatchEvent(approved);
  stop();
  sockets[0].dispatchEvent(approved);

  assert.equal(sockets[0].url, "ws://127.0.0.1:8787/wall/live");
  assert.ok(sockets[0].closed);
  assert.deepEqual(printed, [
    "A new photo is waiting for approval  ·  press c",
    "“Booth crew” is on the wall",
  ]);
  assert.ok(
    requests.every(
      ({ url, init }) =>
        !url.includes("example-local-code") &&
        init.headers.authorization === "Bearer example-local-code",
    ),
  );
});
