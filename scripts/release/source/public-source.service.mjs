import { createHash } from "node:crypto";
import { lstatSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { digest, fullHash, readFile, safePath, sha256 } from "../core/index.mjs";
import { git } from "./git.service.mjs";

function rejectLocalSecrets(directory) {
  for (const name of readdirSync(directory)) {
    if (
      [".git", "node_modules", ".cloudflare", ".turbo", "dist", "build", "coverage"].includes(name)
    )
      continue;
    if (/^(?:\.env(?:\.|$)|\.dev\.vars)/.test(name) && !name.endsWith(".example"))
      throw new Error("Local environment material is not a build input");
    const path = join(directory, name),
      stat = lstatSync(path);
    if (stat.isDirectory()) rejectLocalSecrets(path);
  }
}
export function readPublicSource(request, phase) {
  const { repository, commit, tree, base, branchCommit } = request;
  [commit, tree, base].forEach((value) => fullHash(value, 40));
  if (!["branch", "final"].includes(phase)) throw new Error("Unknown public build phase");
  if (
    git(repository, ["rev-parse", "HEAD"]) !== commit ||
    git(repository, ["rev-parse", `${commit}^{tree}`]) !== tree
  )
    throw new Error("Public commit/tree mismatch");
  const parents = git(repository, ["show", "-s", "--format=%P", commit]).split(" ").filter(Boolean);
  if (phase === "final") fullHash(branchCommit, 40);
  if (digest(parents) !== digest(phase === "branch" ? [base] : [base, branchCommit]))
    throw new Error("Unexpected public commit parents");
  if (
    phase === "final" &&
    (git(repository, ["rev-parse", `${branchCommit}^{tree}`]) !== tree ||
      git(repository, ["show", "-s", "--format=%P", branchCommit]) !== base)
  )
    throw new Error("Final public branch/tree mismatch");
  if (git(repository, ["status", "--porcelain", "--untracked-files=all"]))
    throw new Error("Public source is dirty");
  rejectLocalSecrets(repository);
  const entries = git(repository, ["ls-tree", "-rz", commit]).split("\0").filter(Boolean),
    files = [],
    names = new Set();
  let total = 0;
  for (const entry of entries) {
    const [metadata, path] = entry.split("\t"),
      [mode, type, oid] = metadata.split(" ");
    safePath(path);
    if (/^(?:apps\/tv-android|packages\/android-runtime)(?:\/|$)/.test(path))
      throw new Error("Android application/runtime is not a current public build input");
    if (!["100644", "100755"].includes(mode) || type !== "blob")
      throw new Error("Unsupported public source entry");
    const folded = path.normalize("NFC").toLowerCase();
    if (names.has(folded)) throw new Error("Ambiguous public source path");
    names.add(folded);
    const { bytes, mode: actualMode } = readFile(join(repository, path), repository);
    const actualOid = createHash("sha1")
      .update(`blob ${bytes.length}\0`)
      .update(bytes)
      .digest("hex");
    if (mode !== actualMode || oid !== actualOid) throw new Error("Tracked source bytes changed");
    total += bytes.length;
    if (total > 1024 * 1024 * 1024 || files.length >= 20000)
      throw new Error("Public source size limit");
    files.push({ path, mode, size: bytes.length, digest: sha256(bytes) });
  }
  files.sort((a, b) => Buffer.compare(Buffer.from(a.path), Buffer.from(b.path)));
  const packageJson = JSON.parse(readFile(join(repository, "package.json"), repository).bytes);
  if (packageJson.name !== "boothwall" || packageJson.packageManager !== "pnpm@10.20.0")
    throw new Error("Standalone pinned public workspace required");
  const required = (path) => {
    const file = files.find((entry) => entry.path === path);
    if (!file) throw new Error("Required public input missing");
    return file.digest;
  };
  return {
    commit,
    tree,
    base,
    filesDigest: digest(files),
    lockDigest: required("pnpm-lock.yaml"),
    configDigest: required("packages/shared/src/config/boothwall.config.ts"),
    files,
  };
}
