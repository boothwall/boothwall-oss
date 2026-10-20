-- Configured runtime authority fences are installed before explicit settings migration.
-- Existing stored settings are unchanged. Rollback must retain these fences and the backup.
CREATE TRIGGER settings_configured_runtime_update
BEFORE UPDATE ON settings
WHEN (CASE WHEN json_valid(OLD.value) THEN json_extract(OLD.value, '$.kind') = 'configured-runtime' ELSE 0 END)
BEGIN
  SELECT (CASE WHEN json_valid(NEW.value) = 0 THEN RAISE(ABORT, 'SETTINGS_CONFIGURED_RUNTIME_PROTECTED') END);
  SELECT (CASE WHEN
    NEW.key IS NOT OLD.key
    OR json_extract(NEW.value, '$.kind') IS NOT 'configured-runtime'
    OR json_type(NEW.value, '$.schemaVersion') IS NOT 'integer'
    OR json_extract(NEW.value, '$.schemaVersion') IS NOT 1
    OR json_type(NEW.value, '$.runtimeState') IS NOT 'object'
    OR json_type(NEW.value, '$.runtimeState.playbackPaused') NOT IN ('true', 'false')
    OR json_type(NEW.value, '$.runtimeState.playbackPaused') IS NULL
    OR json_type(NEW.value, '$.runtimeState.uploadsOpen') NOT IN ('true', 'false')
    OR json_type(NEW.value, '$.runtimeState.uploadsOpen') IS NULL
    OR json_type(NEW.value, '$.runtimeState.eventEnded') NOT IN ('true', 'false')
    OR json_type(NEW.value, '$.runtimeState.eventEnded') IS NULL
    OR json_extract(NEW.value, '$.runtimeState.eventEnded') IS NOT json_extract(OLD.value, '$.runtimeState.eventEnded')
    OR json_extract(NEW.value, '$.migration') IS NOT json_extract(OLD.value, '$.migration')
    OR EXISTS (SELECT 1 FROM json_each(NEW.value) WHERE key NOT IN ('kind', 'schemaVersion', 'runtimeState', 'migration'))
    OR EXISTS (SELECT key FROM json_each(NEW.value) GROUP BY key HAVING count(*) > 1)
    OR EXISTS (SELECT 1 FROM json_each(NEW.value, '$.runtimeState') WHERE key NOT IN ('playbackPaused', 'uploadsOpen', 'eventEnded'))
    OR EXISTS (SELECT key FROM json_each(NEW.value, '$.runtimeState') GROUP BY key HAVING count(*) > 1)
  THEN RAISE(ABORT, 'SETTINGS_CONFIGURED_RUNTIME_PROTECTED') END);
END;
--> statement-breakpoint
-- INSERT OR REPLACE may bypass delete triggers; reject before its implicit deletion.
CREATE TRIGGER settings_configured_runtime_replace
BEFORE INSERT ON settings
WHEN EXISTS (
  SELECT 1 FROM settings WHERE key = NEW.key
  AND CASE WHEN json_valid(value) THEN json_extract(value, '$.kind') = 'configured-runtime' ELSE 0 END
)
BEGIN
  SELECT RAISE(ABORT, 'SETTINGS_CONFIGURED_RUNTIME_INSERT_PROTECTED');
END;
--> statement-breakpoint
CREATE TRIGGER settings_configured_runtime_delete
BEFORE DELETE ON settings
WHEN (CASE WHEN json_valid(OLD.value) THEN json_extract(OLD.value, '$.kind') = 'configured-runtime' ELSE 0 END)
BEGIN
  SELECT RAISE(ABORT, 'SETTINGS_CONFIGURED_RUNTIME_PROTECTED');
END;
