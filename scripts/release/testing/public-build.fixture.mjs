import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { git } from "../source/index.mjs";
import { buildFixture } from "../workflow/index.mjs";
import { emitWorkers } from "./emitted-workers.fixture.mjs";

// Only disposable local Git fixtures: this deliberately emits fixture-labelled worker bytes.
export async function fixtureBuildPair({ repository, base, branch, tree, version, output }) {
  const write = (path, bytes) => {
    const full = join(repository, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, bytes);
  };
  const runner = async (step) => {
    if (step.id === "build-web") emitWorkers({ write });
    return { status: 0, stdout: "deterministic fixture command", stderr: "" };
  };
  const common = { repository, base, tree, version };
  const branchPacket = await buildFixture(
    { ...common, commit: branch, phase: "branch", output: join(output, "branch-packet") },
    runner,
  );
  for (const app of ["api", "web"])
    rmSync(join(repository, `apps/${app}/.cloudflare`), { recursive: true });
  const publicCommit = git(repository, [
    "-c",
    "user.name=Fixture",
    "-c",
    "user.email=fixture@example.test",
    "commit-tree",
    tree,
    "-p",
    base,
    "-p",
    branch,
    "-m",
    "Fixture public merge",
  ]);
  git(repository, ["checkout", "--detach", "-q", publicCommit]);
  const finalPacket = await buildFixture(
    {
      ...common,
      commit: publicCommit,
      phase: "final",
      branchCommit: branch,
      branchReceipt: branchPacket.directory,
      branchDigest: branchPacket.digest,
      output: join(output, "final-packet"),
    },
    runner,
  );
  return {
    publicCommit,
    branch: { directory: branchPacket.directory, digest: branchPacket.digest },
    final: { directory: finalPacket.directory, digest: finalPacket.digest },
  };
}
