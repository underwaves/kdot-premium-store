-- ============================================================================
-- PREFLIGHT CHECK SCRIPT FOR CLOUDFLARE D1 (READ-ONLY)
-- Run before applying database migrations (e.g. 0005, 0006).
-- Checks for duplicate slip_hash, slip_trans_ref, and idempotency_key in app_orders.
--
-- USAGE:
--   Local D1:      npm run db:preflight
--   Production D1: npm run db:preflight:remote
--
-- If ANY rows are returned by these queries:
--   1. DO NOT apply the migration yet.
--   2. Manually inspect the affected order codes.
--   3. Contact the customer or update the duplicate entries manually.
--   4. Never run destructive automatic deletion scripts on customer orders.
-- ============================================================================

-- Check 1: Duplicate slip_hash in app_orders
SELECT
  'DUPLICATE_SLIP_HASH' AS check_type,
  slip_hash AS conflict_key,
  COUNT(*) AS total_occurrences,
  GROUP_CONCAT(order_code, ', ') AS conflicting_orders
FROM app_orders
WHERE slip_hash IS NOT NULL AND slip_hash != ''
GROUP BY slip_hash
HAVING COUNT(*) > 1;

-- Check 2: Duplicate slip_trans_ref in app_orders
SELECT
  'DUPLICATE_SLIP_TRANS_REF' AS check_type,
  slip_trans_ref AS conflict_key,
  COUNT(*) AS total_occurrences,
  GROUP_CONCAT(order_code, ', ') AS conflicting_orders
FROM app_orders
WHERE slip_trans_ref IS NOT NULL AND slip_trans_ref != ''
GROUP BY slip_trans_ref
HAVING COUNT(*) > 1;

-- Check 3: Duplicate idempotency_key in app_orders
SELECT
  'DUPLICATE_IDEMPOTENCY_KEY' AS check_type,
  idempotency_key AS conflict_key,
  COUNT(*) AS total_occurrences,
  GROUP_CONCAT(order_code, ', ') AS conflicting_orders
FROM app_orders
WHERE idempotency_key IS NOT NULL AND idempotency_key != ''
GROUP BY idempotency_key
HAVING COUNT(*) > 1;
