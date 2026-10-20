import { describe, expect, it } from "vitest";

import type { AppBindings } from "@/core/runtime/bindings";

import { readConfig } from "./env";

const bindings = (origin: string) =>
  ({
    ADMIN_TOKEN: "local-test-passcode",
    CLIENT_FINGERPRINT_KEY: "fixture-only-client-fingerprint-key-32",
    ALLOWED_ORIGINS: origin,
    RETENTION_DAYS: "7",
  }) as AppBindings;

describe("request configuration", () => {
  it("does not reuse another host's settings in the same worker isolate", () => {
    expect(readConfig(bindings("https://first.example")).ALLOWED_ORIGINS).toEqual([
      "https://first.example",
    ]);
    expect(readConfig(bindings("https://second.example")).ALLOWED_ORIGINS).toEqual([
      "https://second.example",
    ]);
  });
});
