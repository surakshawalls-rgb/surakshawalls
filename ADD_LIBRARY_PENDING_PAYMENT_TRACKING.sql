-- ADD LIBRARY PENDING PAYMENT TRACKING
-- Run this in Supabase SQL Editor before using unpaid registration tracking.

ALTER TABLE public.library_students
ADD COLUMN IF NOT EXISTS payment_pending BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.library_students
ADD COLUMN IF NOT EXISTS pending_payment_amount NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Keep values clean for existing rows.
UPDATE public.library_students
SET payment_pending = COALESCE(payment_pending, FALSE),
    pending_payment_amount = COALESCE(pending_payment_amount, 0)
WHERE payment_pending IS NULL
   OR pending_payment_amount IS NULL;

-- Enforce non-negative pending amount.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'library_students_pending_payment_amount_non_negative'
  ) THEN
    ALTER TABLE public.library_students
    ADD CONSTRAINT library_students_pending_payment_amount_non_negative
    CHECK (pending_payment_amount >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_library_students_payment_pending
ON public.library_students(payment_pending);
