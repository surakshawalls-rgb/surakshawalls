-- One-time migration: Insert missing wage expense entries into firm_cash_ledger for all historical wage payments
-- This script assumes:
--   - wage_payments table: id, payment_date, worker_id, amount_paid, notes
--   - firm_cash_ledger table: date, type, amount, category, description, ref_id
--   - Only inserts entries for wage_payments that do NOT already have a matching firm_cash_ledger entry (by ref_id or unique combination)

-- 1. Add a ref_id column to firm_cash_ledger if not present (optional, for idempotency)
-- ALTER TABLE firm_cash_ledger ADD COLUMN ref_id UUID;


-- Insert missing wage expense entries by matching on date, amount, and category (no ref_id required)
INSERT INTO firm_cash_ledger (date, type, amount, category, description)
SELECT
  wp.payment_date AS date,
  'payment' AS type,
  wp.amount_paid AS amount,
  'wage' AS category,
  CONCAT('Wage payment for worker ', wp.worker_id, COALESCE(' - ' || wp.notes, '')) AS description
FROM wage_payments wp
LEFT JOIN firm_cash_ledger fcl
  ON fcl.date = wp.payment_date
  AND fcl.amount = wp.amount_paid
  AND fcl.category = 'wage'
WHERE fcl.id IS NULL;

-- If you do not have a ref_id column, you can match on date, amount, and worker_id, but ref_id is safest for idempotency.
-- Run this script once to backfill all missing wage expense entries for accurate business dashboard reporting.
