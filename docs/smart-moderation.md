# Upgrading older review settings

**Who needs this:** only an installation whose saved settings from a build before 3.0.0 turn on automated review. A fresh install, or one upgraded from 2.0.0, has nothing to change.

The standalone API provides manual photo approval and removal. It does not run a provider, send photos for automated review, or expose the old `/moderation/status` endpoint.

Keep `settings.smartModeration.enabled` set to `false` in `packages/shared/src/config/boothwall.config.ts`. Existing databases and their historical analysis rows are preserved when upgrading; no migration drops that data.

An older database may also contain saved settings with this flag enabled. New uploads then return `PHOTO_REVIEW_UNAVAILABLE`, with guidance naming the unsupported setting. This refusal prevents a configured check from being silently bypassed. Existing photos and manual approval remain usable.

For an existing installation, follow the explicit [settings migration](config-migration.md). Export the exact raw settings record, review the generated config patch and use `--disable-legacy-review` only after setting both `smartModeration.enabled` and `autoApproveSafe` to `false` in the target configuration (keep `holdFlagged` from the reviewed patch; the object needs all three fields). The migration retains the original policy and historical analysis rows. Standalone `PUT /settings` is no longer mounted; do not delete settings or historical analysis rows as a workaround.

The local demo seed uses the configured policy and explicitly approves its bundled sample photos. It leaves populated walls untouched and refuses an empty wall with unsupported legacy review until its explicit migration decision is applied. It never edits presentation or review settings. Guest photos use the wall's configured `autoApprove` value; the default requires a host's approval.
