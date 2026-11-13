ALTER TABLE `app_orders` ADD `slip_hash` text;--> statement-breakpoint
ALTER TABLE `app_orders` ADD `slip_trans_ref` text;--> statement-breakpoint
ALTER TABLE `app_orders` ADD `slip_sender_bank` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `app_orders` ADD `slip_verify_status` text DEFAULT 'unverified' NOT NULL;--> statement-breakpoint
ALTER TABLE `app_orders` ADD `slip_verify_detail` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `app_orders_slip_hash_idx` ON `app_orders` (`slip_hash`);--> statement-breakpoint
CREATE INDEX `app_orders_slip_ref_idx` ON `app_orders` (`slip_trans_ref`);--> statement-breakpoint
ALTER TABLE `shop_settings` ADD `slip_verify_config` text;