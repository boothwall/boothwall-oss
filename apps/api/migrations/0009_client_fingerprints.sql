-- Forward-only application protocol boundary. Keep existing values for bounded legacy reads.
-- Old queries fail instead of admitting requests against a separate unkeyed counter set.
-- Drain standalone in-flight uploads before applying: old binaries cannot clean untracked R2 puts.
ALTER TABLE photos RENAME COLUMN ip_hash TO client_fingerprint;
--> statement-breakpoint
ALTER TABLE auth_failures RENAME COLUMN ip_hash TO client_fingerprint;
