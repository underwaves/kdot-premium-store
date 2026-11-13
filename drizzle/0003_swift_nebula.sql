ALTER TABLE `app_orders` ADD `slip_key` text;--> statement-breakpoint
ALTER TABLE `app_orders` ADD `slip_status` text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `app_orders` ADD `slip_amount` real;--> statement-breakpoint
ALTER TABLE `app_orders` ADD `slip_uploaded_at` integer;--> statement-breakpoint
ALTER TABLE `app_orders` ADD `slip_reviewed_at` integer;--> statement-breakpoint
ALTER TABLE `app_orders` ADD `slip_review_note` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `app_orders_slip_status_idx` ON `app_orders` (`slip_status`,`created_at`);--> statement-breakpoint
ALTER TABLE `shop_settings` ADD `line_config` text;