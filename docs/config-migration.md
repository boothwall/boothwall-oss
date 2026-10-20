# Migrating saved settings to file authority

**Who needs this:** only an installation whose database already holds saved settings from a build before 3.0.0. A fresh install, or one upgraded from 2.0.0 (which had no settings table), takes its settings from the config and can skip this guide.

Older installations may have presentation values saved in the database. Those values can override file defaults. Back up the database and photo storage before an upgrade. Do not delete the saved settings row to make a new config take effect: it can contain branding, category identities and live playback/upload state.

## Generate an offline preview

Save the existing settings JSON from your backup or the API's `GET /settings` response to a local file. The preview accepts either the saved settings object or the response envelope `{ "settings": { ... } }`. Use the original database record when auditing unknown or invalid historical fields: an API response contains effective settings and can no longer reveal fields discarded by the compatibility reader.

```sh
pnpm boothwall settings-preview saved-settings.json --output settings-preview.json
```

This command reads local files only. It does not contact a provider, change the configuration, update the database or apply the result. It creates a new file with owner-only permissions and refuses to overwrite any existing file. Keep inputs and reports out of version control if they contain private event information.

The version 1 report contains:

- `sources.configuredSha256`: SHA-256 of the validated configuration serialised as JSON.
- `sources.configuredSnapshot`: the normalised original configuration, retained for independent verification after editing the config. Older reports require `--source-config` with matching original normalised JSON, or regeneration from the original sources.
- `sources.storedSha256`: SHA-256 of the exact original input bytes, including an envelope if present.
- `preview.configPatch`: suggested replacements for `event`, `categories` and presentation `settings`, retaining other configured event fields such as venue.
- `preview.runtimeState`: `playbackPaused`, `uploadsOpen` and the legacy `eventEnded` flag. These are recorded separately, not written into the presentation patch.
- `preview.issues`: named fields requiring an operator's decision. `ready: false` means the report is not ready to apply; the command exits with status 2. Invalid values use the same fallback as the compatibility reader, but the issue remains visible. Unknown values are omitted from the report, so retain the original backup. Invalid UTF-8 input is also unready; its original bytes are hashed without replacing undecodable characters.

Category IDs and order are preserved: photos reference those IDs. Renaming a category label does not require a new ID. Explicit `false`, empty announcement/year text and hidden artwork (`null`) remain explicit. The `showWhoIsHere` setting shows **photo counts by category**, not a unique-person or attendance count.

Automated review settings and an ended legacy event require explicit migration decisions. The preview preserves their accepted values and explains what must be reviewed; it does not silently disable a policy or reopen intake. See [older review settings](smart-moderation.md).

## Review before applying changes

Review the whole report against your backup and config. Resolve all issues before preparing a change. Preserve the original input and report so the source digests can identify a stale preview if configuration or stored settings change. Regenerate the report after either source changes.

## Apply the reviewed patch explicitly

Fresh installations use file settings immediately. Older plain settings records stay effective until this procedure succeeds. `GET /settings` returns `X-BoothWall-Settings-Authority: legacy-pending` during that transition and `configured` afterwards. A deployment never silently converts an existing record.

1. Back up D1 and photo storage. Export the **exact raw `value` string** of the `settings` row with key `wall` to the input file, preserving whitespace. An API response or pretty-printed copy is sufficient for preview only; it cannot prove the database source for application. Retain the original config, raw input and preview privately.
2. Upgrade to this compatible API reader and apply core migration `0010_settings_authority.sql` after all earlier core migrations. `pnpm boothwall deploy` applies pending migrations before deploying. Follow migration `0009`'s separate maintenance requirements first. Migration `0010` adds protections but changes no stored values. Existing overrides continue to work.
3. Review `preview.configPatch` and apply exactly its `event`, `categories` and `settings` values to `boothwall.config.ts`. Preserve all other configuration, including deployment identity. Keep category IDs and order. Resolve invalid or unknown historical fields before application; the tool refuses them instead of discarding data. Do not edit the old backup or report to manufacture a ready result.
4. If the only outstanding issues are an ended event or legacy automated review, explicitly choose `--retain-ended` and/or `--disable-legacy-review`. Retaining an ended event keeps it ended and keeps its separate intake preference; it never reopens uploads. Disabling legacy review additionally requires setting both `settings.smartModeration.enabled` and `autoApproveSafe` to `false` in the target config, keeping `holdFlagged` from the reviewed patch (all three fields are required). The original policy remains in the retained backup. There is no implicit approval or provider replacement.
5. Rebuild/deploy the API and web app, and rebuild the native client configuration where applicable. Verify the correct target and artifacts before switching database authority. The CLI verifies local config; it cannot attest which build is currently deployed. Saved legacy settings still take precedence during this step.
6. Run the explicit apply command from that same configured checkout:

```sh
pnpm boothwall settings-apply saved-settings.json --preview settings-preview.json
```

Add only the reviewed decision flags from step 4. The command shows and verifies the configured account/database and confirms before mutation. `--yes` skips the prompt only; it retains identity and source checks. `--local` selects only the local API state at `apps/api/.cloudflare/state`, with no remote fallback. Use a disposable local database for rehearsal.

Application compares the original raw database string, original normalised config digest, exact reviewed preview and exact target config. It also checks that all three immutable-authority triggers from migration `0010` are installed with their expected definitions. It writes one configured-runtime record atomically, retaining the original raw string, source/target digests and explicit decisions. No photos or category references are rewritten. Only playback and upload-intake flags remain writable at runtime. The original migration receipt and legacy ended state are protected from update, replacement and deletion.

After application, verify `GET /settings`, its authority header, configured branding/categories/announcement/count visibility, and the retained playback/intake state. Generic settings replacement, automated-review policy changes and end/reopen routes are absent in the standalone API. Runtime `PATCH /settings/runtime` accepts only `playbackPaused` and `uploadsOpen`.

## Interruption, conflicts and rollback

Keep the same files after an uncertain response. Repeating the exact command recognises the immutable receipt and preserves any later runtime pause/intake changes. A concurrent legacy edit makes the raw-string comparison fail without replacing it: export and review a new preview from the current source. A config or input change during confirmation also stops application. Filesystem changes and remote database transactions are not one transaction; do not concurrently edit the configuration while applying.

Do not delete the settings row, restore the old raw record over the envelope, or remove its protective triggers. Those actions discard migration provenance or reopen old-writer races. Older binaries do not understand the runtime envelope; rollback to them is unsupported after application. Roll back only to a version that understands configured-runtime records and retains migration `0010`. Restore the reviewed configuration and rebuild clients as needed; retain the current runtime record and independent backups. Recovering an older database backup requires an explicit maintenance procedure that reconciles newer runtime changes before traffic resumes, never a routine downgrade.

Migration `0010` is additive and depends on the existing core settings table and all earlier core migrations. It belongs to the core edition only. Writers must support the runtime envelope before authority application; rolling back application does not mean dropping this migration. Nothing in this procedure erases historical settings or automatically starts a new event.
