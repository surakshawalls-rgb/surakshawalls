-- ============================================================
-- COMPLETE REALTIME NOTIFICATION SETUP FOR SUPABASE
-- ============================================================
-- This script will:
-- 1. Enable Realtime on all required tables
-- 2. Configure RLS policies to allow Realtime subscriptions
-- 3. Verify the setup
-- ============================================================

-- ============================================================
-- STEP 1: ENABLE REALTIME ON TABLES
-- ============================================================
-- Note: This script safely adds tables to Realtime publication
--       If a table is already added, it will be skipped

DO $$
DECLARE
  tables_to_add TEXT[] := ARRAY[
    'wage_entries',
    'firm_cash_ledger', 
    'raw_materials_purchase',
    'sales_transactions',
    'partner_master',
    'client_ledger',
    'workers_master',
    'library_students',
    'library_expenses',
    'library_fee_payments',
    'library_cash_ledger'
  ];
  table_name TEXT;
  is_already_added BOOLEAN;
BEGIN
  FOREACH table_name IN ARRAY tables_to_add
  LOOP
    -- Check if table is already in the publication
    SELECT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = table_name
    ) INTO is_already_added;
    
    IF NOT is_already_added THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', table_name);
      RAISE NOTICE '✅ Added % to Realtime', table_name;
    ELSE
      RAISE NOTICE '⏭️  % already in Realtime (skipped)', table_name;
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- STEP 2: CREATE RLS POLICIES FOR REALTIME ACCESS
-- ============================================================
-- Note: Realtime requires SELECT permission through RLS policies
-- If RLS is enabled on tables, we need policies that allow reading

-- Check if RLS is enabled and create appropriate policies

-- Manufacturing/Construction Policies
DO $$ 
BEGIN
  -- wage_entries
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wage_entries'
    AND rowsecurity = true
  ) THEN
    DROP POLICY IF EXISTS "Allow realtime access to wage_entries" ON wage_entries;
    CREATE POLICY "Allow realtime access to wage_entries" ON wage_entries
      FOR SELECT USING (true);
  END IF;

  -- firm_cash_ledger
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'firm_cash_ledger'
    AND rowsecurity = true
  ) THEN
    DROP POLICY IF EXISTS "Allow realtime access to firm_cash_ledger" ON firm_cash_ledger;
    CREATE POLICY "Allow realtime access to firm_cash_ledger" ON firm_cash_ledger
      FOR SELECT USING (true);
  END IF;

  -- raw_materials_purchase
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'raw_materials_purchase'
    AND rowsecurity = true
  ) THEN
    DROP POLICY IF EXISTS "Allow realtime access to raw_materials_purchase" ON raw_materials_purchase;
    CREATE POLICY "Allow realtime access to raw_materials_purchase" ON raw_materials_purchase
      FOR SELECT USING (true);
  END IF;

  -- sales_transactions
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sales_transactions'
    AND rowsecurity = true
  ) THEN
    DROP POLICY IF EXISTS "Allow realtime access to sales_transactions" ON sales_transactions;
    CREATE POLICY "Allow realtime access to sales_transactions" ON sales_transactions
      FOR SELECT USING (true);
  END IF;

  -- partner_master
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_master'
    AND rowsecurity = true
  ) THEN
    DROP POLICY IF EXISTS "Allow realtime access to partner_master" ON partner_master;
    CREATE POLICY "Allow realtime access to partner_master" ON partner_master
      FOR SELECT USING (true);
  END IF;

  -- client_ledger
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'client_ledger'
    AND rowsecurity = true
  ) THEN
    DROP POLICY IF EXISTS "Allow realtime access to client_ledger" ON client_ledger;
    CREATE POLICY "Allow realtime access to client_ledger" ON client_ledger
      FOR SELECT USING (true);
  END IF;

  -- workers_master
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'workers_master'
    AND rowsecurity = true
  ) THEN
    DROP POLICY IF EXISTS "Allow realtime access to workers_master" ON workers_master;
    CREATE POLICY "Allow realtime access to workers_master" ON workers_master
      FOR SELECT USING (true);
  END IF;

  -- Library Tables
  -- library_students
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'library_students'
    AND rowsecurity = true
  ) THEN
    DROP POLICY IF EXISTS "Allow realtime access to library_students" ON library_students;
    CREATE POLICY "Allow realtime access to library_students" ON library_students
      FOR SELECT USING (true);
  END IF;

  -- library_expenses
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'library_expenses'
    AND rowsecurity = true
  ) THEN
    DROP POLICY IF EXISTS "Allow realtime access to library_expenses" ON library_expenses;
    CREATE POLICY "Allow realtime access to library_expenses" ON library_expenses
      FOR SELECT USING (true);
  END IF;

  -- library_fee_payments
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'library_fee_payments'
    AND rowsecurity = true
  ) THEN
    DROP POLICY IF EXISTS "Allow realtime access to library_fee_payments" ON library_fee_payments;
    CREATE POLICY "Allow realtime access to library_fee_payments" ON library_fee_payments
      FOR SELECT USING (true);
  END IF;

  -- library_cash_ledger
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'library_cash_ledger'
    AND rowsecurity = true
  ) THEN
    DROP POLICY IF EXISTS "Allow realtime access to library_cash_ledger" ON library_cash_ledger;
    CREATE POLICY "Allow realtime access to library_cash_ledger" ON library_cash_ledger
      FOR SELECT USING (true);
  END IF;
END $$;

-- ============================================================
-- STEP 3: VERIFY REALTIME IS ENABLED
-- ============================================================

SELECT 
    schemaname, 
    tablename,
    '✅ Realtime Enabled' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
  AND tablename IN (
    'wage_entries', 'firm_cash_ledger', 'raw_materials_purchase',
    'sales_transactions', 'partner_master', 'client_ledger', 'workers_master',
    'library_students', 'library_expenses', 'library_fee_payments', 'library_cash_ledger'
  )
ORDER BY tablename;

-- ============================================================
-- STEP 4: CHECK RLS STATUS
-- ============================================================

SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '🔒 RLS Enabled' 
        ELSE '🔓 RLS Disabled' 
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'wage_entries', 'firm_cash_ledger', 'raw_materials_purchase',
    'sales_transactions', 'partner_master', 'client_ledger', 'workers_master',
    'library_students', 'library_expenses', 'library_fee_payments', 'library_cash_ledger'
  )
ORDER BY tablename;

-- ============================================================
-- SUCCESS CRITERIA
-- ============================================================
-- ✅ First query should show 11 tables with "Realtime Enabled"
-- ✅ Second query shows RLS status for each table
-- ✅ If RLS is enabled, appropriate policies have been created
-- ✅ Your Angular app should now connect without errors
-- ============================================================

-- ============================================================
-- TROUBLESHOOTING
-- ============================================================
-- If you still get errors:
--
-- 1. Check Supabase Dashboard → Database → Replication
--    Make sure Realtime is enabled globally
--
-- 2. Restart your Angular app: ng serve
--
-- 3. Check browser console for connection status
--
-- 4. Verify Supabase URL and Anon Key in notification.service.ts
--
-- 5. Try removing and re-adding a table:
--    ALTER PUBLICATION supabase_realtime DROP TABLE table_name;
--    ALTER PUBLICATION supabase_realtime ADD TABLE table_name;
-- ============================================================
