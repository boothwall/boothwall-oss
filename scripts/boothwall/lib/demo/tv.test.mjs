import assert from "node:assert/strict";
import { test } from "node:test";

import { debugPackage, vegaCli } from "./tv.mjs";

test("finds the SDK's vega CLI, or falls back to the PATH", () => {
  assert.equal(
    vegaCli("/home/me", () => true),
    "/home/me/vega/bin/vega",
  );
  assert.equal(
    vegaCli("/home/me", () => false),
    "vega",
  );
});

test("picks the debug package for this machine's Virtual Device", () => {
  assert.match(debugPackage("arm64"), /build\/aarch64-debug\/tv_aarch64\.vpkg$/);
  assert.match(debugPackage("x64"), /build\/x86_64-debug\/tv_x86_64\.vpkg$/);
});
