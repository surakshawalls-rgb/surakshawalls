-- ============================================================
-- ENABLE REALTIME NOTIFICATIONS IN SUPABASE
-- ============================================================
-- Purpose: Enable Supabase Realtime for important tables
--          to receive instant notifications when data changes
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
-- ============================================================

-- ============================================================
-- MANUFACTURING/CONSTRUCTION TABLES
-- ============================================================

-- Enable Realtime for wage entries
ALTER PUBLICATION supabase_realtime ADD TABLE wage_entries;

-- Enable Realtime for firm cash ledger
ALTER PUBLICATION supabase_realtime ADD TABLE firm_cash_ledger;

-- Enable Realtime for material purchases
ALTER PUBLICATION supabase_realtime ADD TABLE raw_materials_purchase;

-- Enable Realtime for sales transactions
ALTER PUBLICATION supabase_realtime ADD TABLE sales_transactions;

-- Enable Realtime for partner master
ALTER PUBLICATION supabase_realtime ADD TABLE partner_master;

-- Enable Realtime for client ledger
ALTER PUBLICATION supabase_realtime ADD TABLE client_ledger;

-- Enable Realtime for workers master
ALTER PUBLICATION supabase_realtime ADD TABLE workers_master;

-- ============================================================
-- LIBRARY TABLES
-- ============================================================

-- Enable Realtime for library students
ALTER PUBLICATION supabase_realtime ADD TABLE library_students;

-- Enable Realtime for library expenses
ALTER PUBLICATION supabase_realtime ADD TABLE library_expenses;

-- Enable Realtime for library fee payments
ALTER PUBLICATION supabase_realtime ADD TABLE library_fee_payments;

-- Enable Realtime for library cash ledger
ALTER PUBLICATION supabase_realtime ADD TABLE library_cash_ledger;

-- ============================================================
-- VERIFY REALTIME IS ENABLED
-- ============================================================
-- Run this query to see which tables have Realtime enabled
SELECT 
    schemaname, 
    tablename,
    'Realtime Enabled ✅' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- ============================================================
-- EXPECTED OUTPUT
-- ============================================================
-- You should see these tables in the results (11 tables total):
-- 
-- MANUFACTURING/CONSTRUCTION (7 tables):
-- ✅ wage_entries
-- ✅ firm_cash_ledger
-- ✅ raw_materials_purchase
-- ✅ sales_transactions
-- ✅ partner_master
-- ✅ client_ledger
-- ✅ workers_master
--
-- LIBRARY (4 tables):
-- ✅ library_students
-- ✅ library_expenses
-- ✅ library_fee_payments
-- ✅ library_cash_ledger
--
-- If you see all 11 tables, Realtime is successfully enabled! ✅
-- ============================================================

-- ============================================================
-- DISABLE REALTIME (IF NEEDED)
-- ============================================================
-- If you ever need to disable Realtime for a table, use:
-- ALTER PUBLICATION supabase_realtime DROP TABLE table_name;
--
-- Example:
-- ALTER PUBLICATION supabase_realtime DROP TABLE wage_entries;
-- ============================================================

-- ============================================================
-- TROUBLESHOOTING
-- ============================================================
-- If you get an error "relation already added to publication":
-- This means Realtime is already enabled for that table. You can:
-- 1. Skip that table (it's already working!)
-- 2. Or remove and re-add it:
--    ALTER PUBLICATION supabase_realtime DROP TABLE table_name;
--    ALTER PUBLICATION supabase_realtime ADD TABLE table_name;
-- ============================================================
