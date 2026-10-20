import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

export function publicRepository(t) {
  const root = mkdtempSync(join(realpathSync(tmpdir()), "public-build-")),
    repository = join(root, "source");
  mkdirSync(repository);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const git = (...args) =>
    execFileSync("git", ["-C", repository, ...args], {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  const write = (path, bytes) => {
    const full = join(repository, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, bytes);
  };
  git("init", "-q");
  git("config", "user.name", "Fixture");
  git("config", "user.email", "fixture@example.test");
  git("config", "core.hooksPath", "/dev/null");
  write("package.json", JSON.stringify({ name: "boothwall", packageManager: "pnpm@10.20.0" }));
  write("pnpm-lock.yaml", "lockfileVersion: '9.0'\n");
  write(".gitignore", "node_modules/\n.cloudflare/\n");
  write("packages/shared/src/config/boothwall.config.ts", "export const example = true;\n");
  write("apps/web/index.html", "<h1>Public wall</h1>\n");
  const commit = (message) => {
    git("add", ".");
    git("commit", "-qm", message);
    return git("rev-parse", "HEAD");
  };
  const base = commit("public base");
  write("apps/web/index.html", "<h1>Updated public wall</h1>\n");
  const branch = commit("public candidate"),
    tree = git("rev-parse", "HEAD^{tree}");
  function merge() {
    const final = execFileSync(
      "git",
      ["-C", repository, "commit-tree", tree, "-p", base, "-p", branch],
      { input: "public merge\n", encoding: "utf8" },
    ).trim();
    git("checkout", "--detach", "-q", final);
    return final;
  }
  return { root, repository, write, git, commit, base, branch, tree, merge };
}
