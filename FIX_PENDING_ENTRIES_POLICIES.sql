-- =====================================================
-- FIX PENDING_DAILY_ENTRIES POLICIES
-- =====================================================
-- Drop existing policies and recreate them properly
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Labour staff can view own submissions" ON public.pending_daily_entries;
DROP POLICY IF EXISTS "Labour staff can create entries" ON public.pending_daily_entries;
DROP POLICY IF EXISTS "Admin can review entries" ON public.pending_daily_entries;
DROP POLICY IF EXISTS "Admin can delete entries" ON public.pending_daily_entries;

-- Recreate policies using auth.jwt() with proper user_metadata path
CREATE POLICY "Labour staff can view own submissions"
ON public.pending_daily_entries
FOR SELECT
USING (
  auth.uid() = submitted_by OR
  ((auth.jwt()->'user_metadata')->>'role')::text IN ('su', 'admin')
);

CREATE POLICY "Labour staff can create entries"
ON public.pending_daily_entries
FOR INSERT
WITH CHECK (
  auth.uid() = submitted_by AND
  ((auth.jwt()->'user_metadata')->>'role')::text = 'labour_staff'
);

CREATE POLICY "Admin can review entries"
ON public.pending_daily_entries
FOR UPDATE
USING (
  ((auth.jwt()->'user_metadata')->>'role')::text IN ('su', 'admin')
)
WITH CHECK (
  ((auth.jwt()->'user_metadata')->>'role')::text IN ('su', 'admin')
);

CREATE POLICY "Admin can delete entries"
ON public.pending_daily_entries
FOR DELETE
USING (
  ((auth.jwt()->'user_metadata')->>'role')::text IN ('su', 'admin')
);

-- Verify policies created
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'pending_daily_entries';
