import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const workflow = readFileSync(
  new URL("../../../.github/workflows/release-verification.yml", import.meta.url),
  "utf8",
);
test("prepared workflow is manual, read-only, credential-free and final build depends on branch evidence", () => {
  assert.match(workflow, /^on:\n {2}workflow_dispatch:/m);
  assert.doesNotMatch(
    workflow,
    /(?:pull_request_target|workflow_run|tags:|secrets\.|id-token:|contents:\s*write|continue-on-error|always\(\))/,
  );
  assert.equal((workflow.match(/permissions:/g) ?? []).length, 1);
  assert.match(workflow, /^permissions:\n {2}contents: read\n/m);
  assert.match(workflow, /^ {2}final:\n {4}needs: branch\n/m);
  assert.match(workflow, /PUBLIC_BRANCH_DIGEST: \$\{\{ needs.branch.outputs.receipt-digest \}\}/);
  assert.match(workflow, /artifact-ids: \$\{\{ needs.branch.outputs.artifact-id \}\}/);
  assert.equal((workflow.match(/persist-credentials: false/g) ?? []).length, 4);
  assert.deepEqual(
    [...workflow.matchAll(/^\s+run: (.+)$/gm)].map((match) => match[1]),
    [
      "node tooling/scripts/release/cli/public-build.cli.mjs build",
      "node tooling/scripts/release/cli/public-build.cli.mjs build",
    ],
  );
});
test("every action uses a reviewed immutable commit and source checkout uses exact separate inputs", () => {
  const pins = new Map([
    ["actions/checkout", "34e114876b0b11c390a56381ad16ebd13914f8d5"],
    ["actions/setup-node", "49933ea5288caeca8642d1e84afbd3f7d6820020"],
    ["pnpm/action-setup", "41ff72655975bd51cab0327fa583b6e92b6d3061"],
    ["actions/upload-artifact", "ea165f8d65b6e75b540449e92b4886f43607fa02"],
    ["actions/download-artifact", "d3f86a106a0bac45b974a628896c90dbdf5c8093"],
  ]);
  for (const [, action, ref] of workflow.matchAll(/uses: ([\w/-]+)@([^\s]+)/g))
    assert.equal(ref, pins.get(action));
  assert.equal((workflow.match(/ref: \$\{\{ github.sha \}\}/g) ?? []).length, 2);
  for (const name of ["branch_commit", "final_commit"])
    assert.match(workflow, new RegExp(`ref: \\$\\{\\{ inputs\\.${name} \\}\\}`));
  assert.doesNotMatch(workflow, /github-token:|token:|cache:|overwrite: true/);
});
