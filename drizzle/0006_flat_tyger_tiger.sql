DROP INDEX IF EXISTS `app_orders_idempotency_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `app_orders_idempotency_uq` ON `app_orders` (`idempotency_key`) WHERE "app_orders"."idempotency_key" IS NOT NULL;
