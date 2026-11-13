CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`reset_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rate_limits_reset_idx` ON `rate_limits` (`reset_at`);--> statement-breakpoint
DROP INDEX `app_orders_slip_hash_idx`;--> statement-breakpoint
DROP INDEX `app_orders_slip_ref_idx`;--> statement-breakpoint
ALTER TABLE `app_orders` ADD `idempotency_key` text;--> statement-breakpoint
CREATE UNIQUE INDEX `app_orders_slip_hash_uq` ON `app_orders` (`slip_hash`) WHERE "app_orders"."slip_hash" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `app_orders_slip_ref_uq` ON `app_orders` (`slip_trans_ref`) WHERE "app_orders"."slip_trans_ref" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `app_orders_idempotency_idx` ON `app_orders` (`idempotency_key`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_customer_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_name` text NOT NULL,
	`rating` integer DEFAULT 5 NOT NULL,
	`service_label` text DEFAULT '' NOT NULL,
	`comment` text NOT NULL,
	`proof_image_key` text,
	`is_featured` integer DEFAULT false NOT NULL,
	`is_published` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "customer_reviews_rating_range" CHECK("__new_customer_reviews"."rating" >= 1 AND "__new_customer_reviews"."rating" <= 5)
);
--> statement-breakpoint
INSERT INTO `__new_customer_reviews`("id", "customer_name", "rating", "service_label", "comment", "proof_image_key", "is_featured", "is_published", "sort_order", "created_at", "updated_at") SELECT "id", "customer_name", "rating", "service_label", "comment", "proof_image_key", "is_featured", "is_published", "sort_order", "created_at", "updated_at" FROM `customer_reviews`;--> statement-breakpoint
DROP TABLE `customer_reviews`;--> statement-breakpoint
ALTER TABLE `__new_customer_reviews` RENAME TO `customer_reviews`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `customer_reviews_pub_idx` ON `customer_reviews` (`is_published`,`is_featured`,`sort_order`,`created_at`);