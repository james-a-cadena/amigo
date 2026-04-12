ALTER TABLE `audit_logs` ADD `household_id` text NOT NULL DEFAULT '';
--> statement-breakpoint
CREATE INDEX `audit_logs_household_id_idx` ON `audit_logs` (`household_id`);