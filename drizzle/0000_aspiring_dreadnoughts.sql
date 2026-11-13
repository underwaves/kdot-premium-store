CREATE TABLE `admin_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`user_agent` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `admin_sessions_user_idx` ON `admin_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `admin_sessions_expires_idx` ON `admin_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `admin_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'owner' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`failed_attempts` integer DEFAULT 0 NOT NULL,
	`locked_until` integer,
	`last_login_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_email_uq` ON `admin_users` (lower("email"));--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`kind` text DEFAULT 'general' NOT NULL,
	`starts_at` integer,
	`ends_at` integer,
	`is_pinned` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "announcements_window_valid" CHECK("announcements"."ends_at" IS NULL OR "announcements"."starts_at" IS NULL OR "announcements"."ends_at" > "announcements"."starts_at")
);
--> statement-breakpoint
CREATE INDEX `announcements_visible_idx` ON `announcements` (`is_active`,`is_pinned`,`starts_at`);--> statement-breakpoint
CREATE TABLE `contact_channels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`platform` text NOT NULL,
	`label` text NOT NULL,
	`handle` text DEFAULT '' NOT NULL,
	`url` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	`show_in_footer` integer DEFAULT true NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `contact_channels_sort_idx` ON `contact_channels` (`sort_order`);--> statement-breakpoint
CREATE TABLE `credit_packages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`credit_type` text DEFAULT '' NOT NULL,
	`credits` integer NOT NULL,
	`bonus_credits` integer DEFAULT 0 NOT NULL,
	`price` real NOT NULL,
	`compare_at_price` real,
	`currency` text DEFAULT 'THB' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`perks` text DEFAULT '[]' NOT NULL,
	`badge` text DEFAULT '' NOT NULL,
	`is_featured` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "credit_packages_credits_positive" CHECK("credit_packages"."credits" > 0),
	CONSTRAINT "credit_packages_price_nonneg" CHECK("credit_packages"."price" >= 0)
);
--> statement-breakpoint
CREATE INDEX `credit_packages_sort_idx` ON `credit_packages` (`sort_order`);--> statement-breakpoint
CREATE TABLE `customer_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_name` text NOT NULL,
	`rating` integer DEFAULT 5 NOT NULL,
	`service_label` text DEFAULT '' NOT NULL,
	`comment` text NOT NULL,
	`proof_image_key` text,
	`is_featured` integer DEFAULT false NOT NULL,
	`is_published` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "customer_reviews_rating_range" CHECK("customer_reviews"."rating" >= 1 AND "customer_reviews"."rating" <= 5)
);
--> statement-breakpoint
CREATE INDEX `customer_reviews_pub_idx` ON `customer_reviews` (`is_published`,`is_featured`,`sort_order`,`created_at`);--> statement-breakpoint
CREATE TABLE `group_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `group_categories_slug_uq` ON `group_categories` (`slug`);--> statement-breakpoint
CREATE TABLE `groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`category_id` integer,
	`cover_key` text,
	`cover_width` integer,
	`cover_height` integer,
	`description` text DEFAULT '' NOT NULL,
	`details` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`drive_url` text DEFAULT '' NOT NULL,
	`drive_label` text DEFAULT '' NOT NULL,
	`cta_label` text DEFAULT '' NOT NULL,
	`cta_url` text DEFAULT '' NOT NULL,
	`is_published` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `group_categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `groups_category_idx` ON `groups` (`category_id`);--> statement-breakpoint
CREATE INDEX `groups_published_sort_idx` ON `groups` (`is_published`,`sort_order`);--> statement-breakpoint
CREATE TABLE `shop_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`section` text DEFAULT 'rules' NOT NULL,
	`title` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `shop_rules_section_sort_idx` ON `shop_rules` (`section`,`sort_order`);--> statement-breakpoint
CREATE TABLE `shop_settings` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`site_name` text DEFAULT 'K.DOT Premium App' NOT NULL,
	`shop_name` text DEFAULT 'K.DOT Premium App' NOT NULL,
	`tagline` text DEFAULT '' NOT NULL,
	`logo_key` text,
	`seo_description` text DEFAULT '' NOT NULL,
	`theme` text NOT NULL,
	`hero_eyebrow` text DEFAULT '' NOT NULL,
	`hero_title` text DEFAULT '' NOT NULL,
	`hero_subtitle` text DEFAULT '' NOT NULL,
	`hero_banner_key` text,
	`about_title` text DEFAULT '' NOT NULL,
	`about_body` text DEFAULT '' NOT NULL,
	`highlights` text DEFAULT '[]' NOT NULL,
	`service_modes` text DEFAULT '[]' NOT NULL,
	`youtube_music_url` text DEFAULT '' NOT NULL,
	`youtube_music_title` text DEFAULT '' NOT NULL,
	`home_videos` text DEFAULT '[]' NOT NULL,
	`profile_intro` text DEFAULT '' NOT NULL,
	`history` text DEFAULT '' NOT NULL,
	`founded_label` text DEFAULT '' NOT NULL,
	`opening_hours` text DEFAULT '[]' NOT NULL,
	`hours_note` text DEFAULT '' NOT NULL,
	`service_channels` text DEFAULT '[]' NOT NULL,
	`profile_notice` text DEFAULT '' NOT NULL,
	`credit_intro` text DEFAULT '' NOT NULL,
	`credit_types` text DEFAULT '[]' NOT NULL,
	`credit_how_to` text DEFAULT '[]' NOT NULL,
	`credit_terms` text DEFAULT '' NOT NULL,
	`credit_faq` text DEFAULT '[]' NOT NULL,
	`contact_intro` text DEFAULT '' NOT NULL,
	`contact_note` text DEFAULT '' NOT NULL,
	`footer_text` text DEFAULT '' NOT NULL,
	`footer_links` text DEFAULT '[]' NOT NULL,
	`copyright_text` text DEFAULT '' NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "shop_settings_singleton" CHECK("shop_settings"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE `work_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `work_categories_slug_uq` ON `work_categories` (`slug`);--> statement-breakpoint
CREATE TABLE `work_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`work_id` integer NOT NULL,
	`image_key` text NOT NULL,
	`width` integer,
	`height` integer,
	`alt` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `work_images_work_idx` ON `work_images` (`work_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `works` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`category_id` integer,
	`summary` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`tools` text DEFAULT '' NOT NULL,
	`is_featured` integer DEFAULT false NOT NULL,
	`is_published` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `work_categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `works_slug_uq` ON `works` (`slug`);--> statement-breakpoint
CREATE INDEX `works_category_idx` ON `works` (`category_id`);--> statement-breakpoint
CREATE INDEX `works_published_sort_idx` ON `works` (`is_published`,`sort_order`);