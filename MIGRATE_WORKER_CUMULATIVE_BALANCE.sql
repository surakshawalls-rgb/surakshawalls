-- One-time migration: Recalculate and update cumulative_balance for all workers
-- This script assumes:
--   - wage_entries table: wage_earned, paid_today, worker_id
--   - wage_payments table: amount_paid, worker_id
--   - workers_master table: id, cumulative_balance

UPDATE workers_master wm
SET cumulative_balance = COALESCE(earned.total_earned,0) - COALESCE(paid.total_paid,0)
FROM (
    SELECT worker_id, SUM(wage_earned) AS total_earned
    FROM wage_entries
    GROUP BY worker_id
) earned
LEFT JOIN (
    SELECT worker_id, 
           SUM(paid_today) + COALESCE((SELECT SUM(amount_paid) FROM wage_payments WHERE worker_id = we.worker_id),0) AS total_paid
    FROM wage_entries we
    GROUP BY worker_id
) paid ON wm.id = paid.worker_id
WHERE wm.id = earned.worker_id;

-- If you want to also update total_paid in workers_master:
UPDATE workers_master wm
SET total_paid = COALESCE(paid.total_paid,0)
FROM (
    SELECT worker_id, 
           SUM(paid_today) + COALESCE((SELECT SUM(amount_paid) FROM wage_payments WHERE worker_id = we.worker_id),0) AS total_paid
    FROM wage_entries we
    GROUP BY worker_id
) paid
WHERE wm.id = paid.worker_id;

-- Run this script once to fix all historical outstanding balances and totals.