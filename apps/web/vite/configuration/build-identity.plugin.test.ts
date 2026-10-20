import { expect, it, vi } from "vitest";

import { buildIdentity, parseBuildIdentity } from "./build-identity.plugin";

const identity = {
  schemaVersion: 1,
  productVersion: "2.0.1-rc.1",
  buildId: `bw-${"a".repeat(32)}`,
  sourceExportDigest: "b".repeat(64),
  coreSourceDigest: "c".repeat(64),
  coreDependencyDigest: "d".repeat(64),
  protocol: { min: 1, max: 1 },
};
it("emits only the explicit neutral identity in the client build", () => {
  const emitFile = vi.fn();
  const plugin = buildIdentity(JSON.stringify(identity));
  const hook = plugin.generateBundle;
  if (typeof hook !== "function") throw new Error("Expected bundle hook");
  const invoke = (name: string) => Reflect.apply(hook, { environment: { name }, emitFile }, []);
  invoke("worker");
  expect(emitFile).not.toHaveBeenCalled();
  invoke("client");
  expect(emitFile).toHaveBeenCalledWith({
    type: "asset",
    fileName: "release-identity.json",
    source: `${JSON.stringify(identity)}\n`,
  });
});
it("keeps ordinary standalone development unchanged when no identity was supplied", () => {
  expect(buildIdentity(undefined).generateBundle).toBeUndefined();
});
it("rejects unrecognized provenance and malformed identities before bundling", () => {
  for (const value of [
    { ...identity, sourceCommit: "e".repeat(40) },
    { ...identity, publicCommit: "e".repeat(40) },
    { ...identity, buildId: "e".repeat(40) },
    { ...identity, productVersion: "02.1.0" },
    { ...identity, protocol: { min: 2, max: 1 } },
    { ...identity, coreSourceDigest: "bad" },
    { ...identity, protocol: { min: 1, max: 1, extra: true } },
  ])
    expect(() => parseBuildIdentity(JSON.stringify(value))).toThrow();
});
