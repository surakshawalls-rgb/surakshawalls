-- ================================================================
-- FIX: Remove yard_loss_reason_check Constraint
-- ================================================================
-- This constraint is rejecting short reason values like "NA"
-- We'll drop it and allow any text value (or NULL)
-- ================================================================

-- Step 1: Drop the problematic constraint
ALTER TABLE yard_loss 
  DROP CONSTRAINT IF EXISTS yard_loss_reason_check;

-- Step 2: Verify the constraint is removed
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
WHERE t.relname = 'yard_loss'
ORDER BY conname;

-- Expected Result: yard_loss_reason_check should NOT appear in the list

-- ================================================================
-- REASON FOR THIS FIX:
-- The original constraint was likely checking for minimum length or 
-- specific patterns, rejecting values like "NA", "N/A", etc.
-- 
-- Since 'reason' is already a TEXT column with NULL allowed,
-- we don't need additional validation in the database.
-- Frontend validation will ensure users enter descriptive reasons.
-- ================================================================
