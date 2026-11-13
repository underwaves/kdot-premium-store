CREATE TABLE `app_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_code` text NOT NULL,
	`product_id` integer,
	`product_name` text NOT NULL,
	`plan_label` text NOT NULL,
	`plan_days` integer NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_price` real NOT NULL,
	`total_price` real NOT NULL,
	`customer_name` text NOT NULL,
	`contact_info` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`admin_note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `app_products`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `app_orders_code_uq` ON `app_orders` (`order_code`);--> statement-breakpoint
CREATE INDEX `app_orders_status_created_idx` ON `app_orders` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `app_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`category` text DEFAULT 'streaming' NOT NULL,
	`badge` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`cover_key` text,
	`plans` text DEFAULT '[]' NOT NULL,
	`is_featured` integer DEFAULT false NOT NULL,
	`is_published` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `app_products_pub_sort_idx` ON `app_products` (`is_published`,`sort_order`);