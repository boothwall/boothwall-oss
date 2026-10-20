import assert from "node:assert/strict";
import { test } from "node:test";

import { lanAddress } from "./network.mjs";

const v4 = (address, internal = false) => ({ family: "IPv4", address, internal });

test("prefers a physical adapter over loopback, link-local and virtual bridges", () => {
  assert.equal(
    lanAddress({
      lo0: [v4("127.0.0.1", true), { family: "IPv6", address: "::1", internal: true }],
      bridge100: [v4("192.168.64.1")],
      en7: [v4("169.254.10.2")],
      en0: [{ family: "IPv6", address: "fe80::1", internal: false }, v4("192.168.1.20")],
    }),
    "192.168.1.20",
  );
});

test("falls back to a virtual adapter, and to null without a network", () => {
  assert.equal(lanAddress({ bridge100: [v4("192.168.64.1")] }), "192.168.64.1");
  assert.equal(lanAddress({ lo0: [v4("127.0.0.1", true)] }), null);
});
