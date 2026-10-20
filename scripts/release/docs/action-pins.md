# Action revision evidence

Observed 2026-10-14 UTC using unauthenticated, read-only official GitHub tag-ref metadata and the
`action.yml`/README at each resolved commit. No action archive was downloaded or workflow run.
These exact v4-family revisions preserve the existing workflow interfaces; this is not a claim
that they are the newest major versions.

| Action and tag                   | Immutable commit                           | Official tag metadata                                                             |
| -------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------- |
| actions/checkout v4.3.1          | `34e114876b0b11c390a56381ad16ebd13914f8d5` | [tag](https://api.github.com/repos/actions/checkout/git/ref/tags/v4.3.1)          |
| actions/setup-node v4.4.0        | `49933ea5288caeca8642d1e84afbd3f7d6820020` | [tag](https://api.github.com/repos/actions/setup-node/git/ref/tags/v4.4.0)        |
| pnpm/action-setup v4.2.0         | `41ff72655975bd51cab0327fa583b6e92b6d3061` | [tag](https://api.github.com/repos/pnpm/action-setup/git/ref/tags/v4.2.0)         |
| actions/upload-artifact v4.6.2   | `ea165f8d65b6e75b540449e92b4886f43607fa02` | [tag](https://api.github.com/repos/actions/upload-artifact/git/ref/tags/v4.6.2)   |
| actions/download-artifact v4.3.0 | `d3f86a106a0bac45b974a628896c90dbdf5c8093` | [tag](https://api.github.com/repos/actions/download-artifact/git/ref/tags/v4.3.0) |

The pnpm tag is annotated; the recorded commit is the peeled commit. All five action definitions
use the Node 20 action runtime, which is separate from the project's Node 24 process. The hosted
Ubuntu 24.04 jobs request Node 24 and exact pnpm 10.20.0; the receipt records the actual Node patch
version. No package cache is configured. This workflow does not claim support for GitHub Enterprise
Server artifact service variants.

Checkout supports explicit refs, full history and disabled credential persistence. Setup-node
supports a Node version input without enabling a cache. pnpm setup receives an explicit version
and `run_install: false`. Upload v4 supports immutable uploads, failure on absent files and disabled
overwrite/hidden-file inclusion; download v4 supports selecting the exact same-run artifact ID.
The final packet is independently checksum-verified after download.

Definitions inspected:
[checkout](https://github.com/actions/checkout/blob/34e114876b0b11c390a56381ad16ebd13914f8d5/action.yml),
[setup-node](https://github.com/actions/setup-node/blob/49933ea5288caeca8642d1e84afbd3f7d6820020/action.yml),
[pnpm setup](https://github.com/pnpm/action-setup/blob/41ff72655975bd51cab0327fa583b6e92b6d3061/action.yml),
[upload](https://github.com/actions/upload-artifact/blob/ea165f8d65b6e75b540449e92b4886f43607fa02/action.yml),
[download](https://github.com/actions/download-artifact/blob/d3f86a106a0bac45b974a628896c90dbdf5c8093/action.yml).
