-- =====================================================
-- REMOVE TEST LIBRARY STUDENTS + CASH IMPACT CLEANUP
-- =====================================================
-- Target test students:
-- 1) Mobile 1234567889, Address abc, Joined 2026-03-19
-- 2) Mobile 1222111112, Address avc, Joined 2026-03-19
--
-- This script will:
-- - Identify only the above test students
-- - Remove linked library_cash_ledger income rows via fee-payment reference_id
-- - Remove linked library_fee_payments
-- - Free any seat occupied by these students
-- - Delete student records
--
-- Safety:
-- - Aborts if 0 rows matched
-- - Aborts if more than 2 rows matched
-- - Runs inside one transaction
-- =====================================================

BEGIN;

CREATE TEMP TABLE _target_students ON COMMIT DROP AS
SELECT s.id, s.name, s.mobile
FROM public.library_students s
WHERE
  (
    s.mobile = '1234567889'
    AND LOWER(TRIM(COALESCE(s.address, ''))) = 'abc'
    AND s.joining_date = DATE '2026-03-19'
  )
  OR
  (
    s.mobile = '1222111112'
    AND LOWER(TRIM(COALESCE(s.address, ''))) = 'avc'
    AND s.joining_date = DATE '2026-03-19'
  );

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM _target_students;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'No matching test students found. Nothing deleted.';
  ELSIF v_count > 2 THEN
    RAISE EXCEPTION 'Safety abort: % rows matched in library_students (expected max 2).', v_count;
  ELSE
    RAISE NOTICE 'Matched % test student row(s). Proceeding with cleanup.', v_count;
  END IF;
END $$;

CREATE TEMP TABLE _target_payments ON COMMIT DROP AS
SELECT p.id
FROM public.library_fee_payments p
WHERE p.student_id IN (SELECT id FROM _target_students);

-- Remove linked cash ledger rows first so library cash is corrected.
DELETE FROM public.library_cash_ledger l
WHERE l.reference_id::text IN (
  SELECT id::text FROM _target_payments
);

-- Remove fee payment rows of target students.
DELETE FROM public.library_fee_payments p
WHERE p.id IN (
  SELECT id FROM _target_payments
);

-- Free any seat occupied by target students.
UPDATE public.library_seats
SET
  full_time_student_id = NULL,
  full_time_expiry = NULL
WHERE full_time_student_id IN (SELECT id FROM _target_students);

UPDATE public.library_seats
SET
  first_half_student_id = NULL,
  first_half_expiry = NULL
WHERE first_half_student_id IN (SELECT id FROM _target_students);

UPDATE public.library_seats
SET
  second_half_student_id = NULL,
  second_half_expiry = NULL
WHERE second_half_student_id IN (SELECT id FROM _target_students);

-- Finally remove test students.
DELETE FROM public.library_students s
WHERE s.id IN (
  SELECT id FROM _target_students
);

-- Ensure no target mobile remains.
DO $$
DECLARE
  v_left INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_left
  FROM public.library_students
  WHERE mobile IN ('1234567889', '1222111112');

  IF v_left > 0 THEN
    RAISE EXCEPTION 'Delete incomplete: % target row(s) still exist in library_students.', v_left;
  END IF;
END $$;

COMMIT;

-- Post-run quick validation
SELECT seat_no, full_time_student_id, first_half_student_id, second_half_student_id
FROM public.library_seats
WHERE seat_no IN (3, 9)
ORDER BY seat_no;
