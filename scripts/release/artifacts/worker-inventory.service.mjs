import { lstatSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { digest, readFile, safePath, sha256 } from "../core/index.mjs";
import { outputPath, workerProfiles } from "./worker-profile.constants.mjs";

export function validateWorkerFiles(files, contents) {
  for (const app of ["api", "web"]) {
    const prefix = `${app}/`,
      configPath = `${prefix}worker.config.json`;
    const config = files.find((file) => file.path === configPath);
    if (!config || digest(JSON.parse(contents.get(config.digest))) !== digest(workerProfiles[app]))
      throw new Error("Emitted worker config is outside the reviewed example profile");
    if (
      !files.some(
        (file) =>
          file.path === `${prefix}${app === "api" ? "bundle/index.js" : "assets/index.html"}`,
      )
    )
      throw new Error("Required emitted worker entry missing");
  }
  for (const file of files) {
    safePath(file.path);
    if (
      !/^(api|web)\/(worker\.config\.json|assets\/_redirects|bundle\/\.vite\/manifest\.json|(?:bundle|assets)\/(?!.*(?:^|\/)\.)[\s\S]+\.(?:js|css|html|json|txt|svg|png|jpe?g|webp|ico|woff2?|ttf|wasm|webmanifest))$/.test(
        file.path,
      )
    )
      throw new Error("Unsupported emitted worker file");
    const text = contents.get(file.digest).toString("utf8");
    if (/(?:\/\/|\/\*)[#@]\s*sourceMappingURL\s*=|["']sourcesContent["']\s*:/.test(text))
      throw new Error("Source map in emitted worker");
    if (/-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:sk_live|sk_test|ghp)_[A-Za-z0-9]+/.test(text))
      throw new Error("Credential material in emitted worker");
  }
}
export function snapshotWorkers(repository) {
  const files = [],
    contents = new Map();
  let size = 0;
  function walk(directory, prefix) {
    for (const name of readdirSync(directory).sort()) {
      const path = join(directory, name),
        relative = `${prefix}${name}`,
        stat = lstatSync(path);
      if (stat.isDirectory()) walk(path, `${relative}/`);
      else {
        const { bytes, mode } = readFile(path, repository);
        size += bytes.length;
        if (files.length >= 10000 || size > 512 * 1024 * 1024)
          throw new Error("Emitted worker size limit");
        const hash = sha256(bytes);
        contents.set(hash, bytes);
        files.push({ path: relative, digest: hash, size: bytes.length, mode });
      }
    }
  }
  for (const app of ["api", "web"]) walk(join(repository, outputPath(app)), `${app}/`);
  files.sort((a, b) => Buffer.compare(Buffer.from(a.path), Buffer.from(b.path)));
  validateWorkerFiles(files, contents);
  return { files, contents, digest: digest(files) };
}
