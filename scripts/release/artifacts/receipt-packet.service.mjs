import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { canonical, digest, fullHash, readFile, sha256 } from "../core/index.mjs";
import { validateReceipt } from "./receipt-validation.service.mjs";
import { validateWorkerFiles } from "./worker-inventory.service.mjs";

export function writeReceipt(directory, receipt, contents) {
  validateReceipt(receipt);
  mkdirSync(directory);
  mkdirSync(join(directory, "blobs"));
  for (const [hash, bytes] of contents) {
    fullHash(hash);
    if (sha256(bytes) !== hash) throw new Error("Blob digest mismatch");
    writeFileSync(join(directory, "blobs", hash), bytes, { flag: "wx", mode: 0o444 });
  }
  writeFileSync(join(directory, "receipt.json"), canonical(receipt), { flag: "wx", mode: 0o444 });
  const checksum =
    `${digest(receipt)}  receipt.json\n` +
    [...contents.keys()]
      .sort()
      .map((hash) => `${hash}  blobs/${hash}\n`)
      .join("");
  writeFileSync(join(directory, "checksums.txt"), checksum, { flag: "wx", mode: 0o444 });
  return readReceipt(directory, digest(receipt));
}
export function readReceipt(directory, expectedDigest) {
  fullHash(expectedDigest);
  if (readdirSync(directory).sort().join(",") !== "blobs,checksums.txt,receipt.json")
    throw new Error("Unexpected receipt packet entries");
  const bytes = readFile(join(directory, "receipt.json"), directory).bytes;
  if (sha256(bytes) !== expectedDigest) throw new Error("Receipt digest mismatch");
  const receipt = JSON.parse(bytes);
  validateReceipt(receipt);
  if (bytes.toString() !== canonical(receipt)) throw new Error("Noncanonical receipt");
  const hashes = [...new Set(receipt.artifacts.files.map((file) => file.digest))].sort(),
    contents = new Map();
  let total = 0;
  if (readdirSync(join(directory, "blobs")).sort().join(",") !== hashes.join(","))
    throw new Error("Unexpected receipt blobs");
  for (const hash of hashes) {
    const blob = readFile(join(directory, "blobs", hash), directory).bytes;
    total += blob.length;
    if (sha256(blob) !== hash || total > 512 * 1024 * 1024)
      throw new Error("Artifact blob digest or size mismatch");
    contents.set(hash, blob);
  }
  if (receipt.artifacts.files.some((file) => contents.get(file.digest).length !== file.size))
    throw new Error("Artifact byte count mismatch");
  const checksum =
    `${expectedDigest}  receipt.json\n` + hashes.map((hash) => `${hash}  blobs/${hash}\n`).join("");
  if (readFile(join(directory, "checksums.txt"), directory).bytes.toString() !== checksum)
    throw new Error("Checksum inventory mismatch");
  validateWorkerFiles(receipt.artifacts.files, contents);
  return { directory, digest: expectedDigest, receipt, contents };
}
