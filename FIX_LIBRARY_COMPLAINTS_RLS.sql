-- =====================================================
-- Fix Row Level Security Policies for library_complaints
-- =====================================================
-- This script fixes the "new row violates row-level security policy" error
-- by creating permissive policies that allow all operations on library_complaints table

-- Step 1: Drop ALL existing policies (if any) - handles any naming pattern
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'library_complaints'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON library_complaints', policy_record.policyname);
    END LOOP;
END $$;

-- Step 2: Create new permissive policies

-- Allow SELECT for all users
CREATE POLICY "library_complaints_select_policy"
  ON library_complaints FOR SELECT
  USING (true);

-- Allow INSERT for all users
CREATE POLICY "library_complaints_insert_policy"
  ON library_complaints FOR INSERT
  WITH CHECK (true);

-- Allow UPDATE for all users
CREATE POLICY "library_complaints_update_policy"
  ON library_complaints FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow DELETE for all users
CREATE POLICY "library_complaints_delete_policy"
  ON library_complaints FOR DELETE
  USING (true);

-- Step 3: Ensure RLS is enabled on the table
ALTER TABLE library_complaints ENABLE ROW LEVEL SECURITY;

-- Step 4: Verify the policies are created
SELECT * FROM pg_policies WHERE tablename = 'library_complaints';
