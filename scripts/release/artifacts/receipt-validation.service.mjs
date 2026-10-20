import { checkIds, closed, commands, digest, fullHash, safePath, version } from "../core/index.mjs";
import { legacyNativeEvidence, nativeEvidence } from "./worker-profile.constants.mjs";

function inventory(files) {
  if (!Array.isArray(files) || !files.length || files.length > 20000)
    throw new Error("Invalid receipt inventory");
  let prior = "";
  const names = new Set();
  for (const file of files) {
    closed(file, ["path", "mode", "size", "digest"]);
    safePath(file.path);
    fullHash(file.digest);
    const folded = file.path.normalize("NFC").toLowerCase();
    if (
      names.has(folded) ||
      Buffer.compare(Buffer.from(prior), Buffer.from(file.path)) >= 0 ||
      !["100644", "100755"].includes(file.mode) ||
      !Number.isSafeInteger(file.size) ||
      file.size < 0 ||
      file.size > 128 * 1024 * 1024
    )
      throw new Error("Invalid receipt file");
    names.add(folded);
    prior = file.path;
  }
}
export function validateReceipt(receipt) {
  closed(receipt, [
    "schemaVersion",
    "kind",
    "phase",
    "execution",
    "issuance",
    "publishable",
    "version",
    "source",
    "toolchain",
    "checks",
    "artifacts",
    "native",
    "branchReceiptDigest",
  ]);
  if (
    ![1, 2].includes(receipt.schemaVersion) ||
    receipt.kind !== "public-build-receipt" ||
    !["branch", "final"].includes(receipt.phase) ||
    !["fixture", "process"].includes(receipt.execution) ||
    receipt.issuance !== "unsigned" ||
    receipt.publishable !== false
  )
    throw new Error("Unsupported receipt authority or phase");
  version(receipt.version);
  const source = receipt.source;
  closed(source, ["commit", "tree", "base", "filesDigest", "lockDigest", "configDigest", "files"]);
  [source.commit, source.tree, source.base].forEach((value) => fullHash(value, 40));
  [source.filesDigest, source.lockDigest, source.configDigest].forEach((value) => fullHash(value));
  inventory(source.files);
  if (
    receipt.schemaVersion === 2 &&
    source.files.some(({ path }) =>
      /^(?:apps\/tv-android|packages\/android-runtime)(?:\/|$)/.test(path),
    )
  )
    throw new Error("Android source is not a current public receipt input");
  if (
    digest(source.files) !== source.filesDigest ||
    source.files.find((file) => file.path === "pnpm-lock.yaml")?.digest !== source.lockDigest ||
    source.files.find((file) => file.path === "packages/shared/src/config/boothwall.config.ts")
      ?.digest !== source.configDigest
  )
    throw new Error("Source inventory digest mismatch");
  closed(receipt.toolchain, ["node", "pnpm"]);
  if (
    !/^24\.\d+\.\d+$/.test(receipt.toolchain.node) ||
    receipt.toolchain.pnpm !== "10.20.0" ||
    digest(receipt.native) !==
      digest(receipt.schemaVersion === 1 ? legacyNativeEvidence : nativeEvidence)
  )
    throw new Error("Unsupported toolchain/native claim");
  const ids = checkIds(receipt.phase);
  if (!Array.isArray(receipt.checks) || receipt.checks.length !== ids.length)
    throw new Error("Missing required public checks");
  receipt.checks.forEach((check, index) => {
    closed(check, ["id", "commandDigest", "exitCode", "stdoutDigest", "stderrDigest"]);
    if (
      check.id !== ids[index] ||
      check.exitCode !== 0 ||
      check.commandDigest !== digest(commands[check.id])
    )
      throw new Error("Required public check mismatch");
    [check.stdoutDigest, check.stderrDigest].forEach((value) => fullHash(value));
  });
  closed(receipt.artifacts, ["digest", "files"]);
  inventory(receipt.artifacts.files);
  if (receipt.artifacts.digest !== digest(receipt.artifacts.files))
    throw new Error("Artifact inventory digest mismatch");
  if (receipt.phase === "final") fullHash(receipt.branchReceiptDigest);
  else if (receipt.branchReceiptDigest !== null)
    throw new Error("Branch receipt cannot claim prior CI");
}
