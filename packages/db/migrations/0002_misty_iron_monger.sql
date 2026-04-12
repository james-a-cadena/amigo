-- Existing audit_logs rows receive household_id = '' via DEFAULT.
-- If production has pre-change audit history that must stay tenant-scoped in the app,
-- run a one-off backfill (joining record_id to the owning row) before relying on
-- household_id filters for those legacy rows.
ALTER TABLE `audit_logs` ADD `household_id` text NOT NULL DEFAULT '';
--> statement-breakpoint
CREATE INDEX `audit_logs_household_id_idx` ON `audit_logs` (`household_id`);