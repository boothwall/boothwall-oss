# Public release verification

The manually invoked `release-verification.yml` workflow checks an exact public branch commit,
then builds the exact final public merge in another fresh job. It has repository contents read
permission only. It cannot create a branch, tag, release, deployment or signature.

Inputs are a product SemVer and full public branch, base, tree and final commit IDs. The verifier
reads Git itself, checks parent order, hashes every tracked file and checks the bytes again after
the commands. The final commit must have parents `[base, branch]` and the same tree as the branch.
Dirty source, local environment files, existing dependencies/caches, symlinks and stale worker
output fail closed. The output directory must be physically outside the source checkout.

The branch runs frozen installation with lifecycle scripts disabled, the existing explicit
Vite delegate setup, typecheck, lint, tests, formatting and explicit API/web builds. The final job
first verifies the branch packet digest obtained from the preceding job, then repeats installation,
delegate setup and API/web builds. Neither job runs a native build. Child processes use a fresh
home and an environment allowlist without repository tokens, provider settings or runtime identity
overrides. This is environment isolation, not an operating-system network sandbox.

Only the checked-in example worker configuration is admitted. The API and web outputs under
`.cloudflare/output/v0/workers/default` are inventoried as emitted: `worker.config.json`,
`bundle/index.js`, static `assets/`, and Vite build metadata. Source maps and credential material
are refused. Build metadata is retained for integrity review and is not a served asset.

A packet contains canonical `receipt.json`, exact `checksums.txt`, and content-addressed `blobs/`.
The receipt identifies the public commit/tree/base, every source file, lock and configuration
digests, actual Node version, pnpm version, fixed command results and emitted file sizes/hashes.
Console output is represented by hashes; environment values and local paths are not copied into
the receipt. Changing a blob, size, check sequence or checksum causes verification to fail.

`node scripts/release/cli/public-build.cli.mjs verify <packet> <digest>` reads and verifies a
packet without building. Explicit `build` uses `PUBLIC_SOURCE_DIRECTORY`, `PUBLIC_COMMIT`,
`PUBLIC_TREE`, `PUBLIC_BASE`, `PUBLIC_VERSION`, `PUBLIC_PHASE` and `PUBLIC_RECEIPT_DIRECTORY`.
Final builds additionally require `PUBLIC_BRANCH_COMMIT`, `PUBLIC_BRANCH_RECEIPT` and
`PUBLIC_BRANCH_DIGEST`. No command defaults to a build or publication action.

Every packet is unsigned and has `publishable: false`. The injected local test runner always
records `execution: fixture`; subprocess execution records `execution: process`. Neither label
is trusted CI issuance. An independent authorized verifier must validate the workflow revision,
run identity, exact packet digests and final public repository state before issuing any approval.
The packet has no private candidate ID, source commit, approval, publication-plan identity or
operator information. It is not a publication manifest or a final asset approval.

Android and Vega evidence is explicitly `not-built`. A release still needs separate supported
SDK/toolchain, signing and immutable native artifact evidence. This tooling does not infer such
evidence from source tests. Archive/binary publication adapters, trusted CI issuance, durable
approved-artifact storage and the production publisher are separate requirements. Artifact
retention in this workflow is 30 days and is not a durable release record.

The workflow is prepared source, not a record of an executed or successful hosted run. Local tests
use temporary Git repositories and deterministic emitted files; they do not replace public CI.
See [action pins](action-pins.md) for the exact reviewed action revisions.
