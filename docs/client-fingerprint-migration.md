# Updating client fingerprints

**Who needs this:** an existing installation that upgrades to 3.0.0, including one on 2.0.0. A fresh install gets the key from setup and can skip the maintenance steps.

Migration `0009_client_fingerprints.sql` changes how the API identifies clients for abuse limits. New records use a daily, purpose-separated HMAC. The server key prevents someone with only a database copy from enumerating IPv4 addresses using the old public date salt. These identifiers are pseudonyms, not anonymous data. Existing records keep their current cleanup lifecycle.

## Prepare the key

The API needs a separate random `CLIENT_FINGERPRINT_KEY` of at least 32 characters. Keep it in `apps/api/.dev.vars` for local development and in the deployed Worker's secret configuration. Do not use the Control passcode as this key, commit it, print it in logs, or send it to a browser.

Setup and the local demo create a random key if none exists, retain an existing valid value, and reject ambiguous or weak values. For manual development, configure both secrets from `.dev.vars.example` before starting the API. The length requirement alone does not make a chosen password random.

## Existing installations need a maintenance update

Do not apply this migration to a running installation as a rolling update. It renames stored fingerprint columns and changes the reaction-room protocol. Old API code cannot read or write those columns afterward, and mixed reaction protocols refuse requests.

1. Prepare the new API and room code, the secret, and a consistent database/storage backup. Check your deployment target before changing it.
2. Put the installation into maintenance at ingress, stop new requests, and drain old workers, uploads, and open connections. Closing uploads in Control alone does not drain work already running. An old upload interrupted between object storage and its database insert can leave an untracked object.
3. Apply the migration and switch the API and room code together while traffic remains stopped. Existing records and active counters are preserved; the new code reads still-active legacy counters and writes only keyed values.
4. Verify the new code and secret against the migrated database before reopening traffic. Check guest upload, Control authentication, and reactions.

The setup/deploy commands do not establish or verify this maintenance window for you. Do not run an unattended upgrade until your ingress and deployment procedure supply it. There is no automatic rollback to an old binary: recovery must keep compatible code and schema, or restore a consistent backup under maintenance after accounting for changes made since it was taken.

Keep the fingerprint key stable while abuse-limit windows are active. A key change produces different identifiers; there is no previous-key ring. Rotation requires a separately planned transition that drains admissions and lets active windows expire (up to 24 hours for uploads). Changing the key does not rewrite old records or guarantee erasure of historical digests. Reaction counters retain their existing in-memory restart behaviour.
