import { existsSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";

import {
  nativeEvidence,
  outputPath,
  readReceipt,
  snapshotWorkers,
  writeReceipt,
} from "../artifacts/index.mjs";
import { checkIds, closed, commands, digest, sha256, version } from "../core/index.mjs";
import { assertFreshCheckout, readPublicSource } from "../source/index.mjs";
import { processRunner } from "./process-runner.service.mjs";

async function build(request, execution, makeRunner) {
  closed(
    request,
    ["repository", "commit", "tree", "base", "version", "phase", "output"],
    ["branchCommit", "branchReceipt", "branchDigest"],
  );
  version(request.version);
  const repository = realpathSync(request.repository),
    output = join(realpathSync(dirname(resolve(request.output))), basename(request.output));
  const suffix = relative(repository, output);
  if (
    !isAbsolute(request.output) ||
    !(suffix === ".." || suffix.startsWith("../")) ||
    existsSync(output)
  )
    throw new Error("Fresh output outside public checkout required");
  assertFreshCheckout(repository);
  const source = readPublicSource({ ...request, repository }, request.phase);
  for (const app of ["api", "web"])
    if (existsSync(join(repository, outputPath(app))))
      throw new Error("Stale emitted worker output");
  let branchDigest = null;
  if (request.phase === "final") {
    const branch = readReceipt(request.branchReceipt, request.branchDigest).receipt;
    if (
      branch.schemaVersion !== 2 ||
      branch.phase !== "branch" ||
      branch.execution !== execution ||
      branch.version !== request.version ||
      branch.source.commit !== request.branchCommit ||
      branch.source.base !== source.base ||
      branch.source.tree !== source.tree ||
      branch.source.filesDigest !== source.filesDigest
    )
      throw new Error("Exact successful branch receipt required");
    branchDigest = request.branchDigest;
  } else if (
    [request.branchCommit, request.branchReceipt, request.branchDigest].some(
      (value) => value !== undefined,
    )
  )
    throw new Error("Unexpected branch gate input");
  const runner = makeRunner(repository),
    checks = [];
  try {
    for (const id of checkIds(request.phase)) {
      const result = await runner({ id, command: commands[id] });
      if (result.status !== 0) throw new Error(`Public check failed: ${id}`);
      checks.push({
        id,
        commandDigest: digest(commands[id]),
        exitCode: 0,
        stdoutDigest: sha256(result.stdout),
        stderrDigest: sha256(result.stderr),
      });
    }
  } finally {
    runner.close?.();
  }
  if (digest(readPublicSource({ ...request, repository }, request.phase)) !== digest(source))
    throw new Error("Public source changed during build");
  const artifacts = snapshotWorkers(repository);
  const receipt = {
    schemaVersion: 2,
    kind: "public-build-receipt",
    phase: request.phase,
    execution,
    issuance: "unsigned",
    publishable: false,
    version: request.version,
    source,
    toolchain: { node: process.versions.node, pnpm: "10.20.0" },
    checks,
    artifacts: { digest: artifacts.digest, files: artifacts.files },
    native: nativeEvidence,
    branchReceiptDigest: branchDigest,
  };
  return writeReceipt(output, receipt, artifacts.contents);
}
export const buildPublic = (request) => build(request, "process", processRunner);
// Dependency injection is labelled permanently as fixture evidence; the process CLI has no override.
export const buildFixture = (request, runner) => build(request, "fixture", () => runner);
