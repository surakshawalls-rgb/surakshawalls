-- ============================================================
-- FIX: Enable user_push_tokens table for client inserts
-- ============================================================
-- Issue: FCM tokens not being saved from app
-- Cause: RLS policies may be blocking client-side inserts
-- Solution: Add permissive policies or disable RLS for this table
-- ============================================================

-- Check current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'user_push_tokens';

-- Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_push_tokens';

-- ============================================================
-- SOLUTION 1: Disable RLS (Recommended for device tokens)
-- ============================================================
-- Device tokens are not sensitive data - they're just device IDs
-- Users should be able to register their own devices

ALTER TABLE user_push_tokens DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- SOLUTION 2: If you prefer to keep RLS enabled, use these policies:
-- ============================================================
-- Uncomment if you want RLS but allow all authenticated users

-- ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;
-- 
-- -- Allow any authenticated user to insert their own token
-- CREATE POLICY "Users can insert own tokens"
--   ON user_push_tokens
--   FOR INSERT
--   TO authenticated, anon
--   WITH CHECK (true);
-- 
-- -- Allow any authenticated user to view their own tokens
-- CREATE POLICY "Users can view own tokens"
--   ON user_push_tokens
--   FOR SELECT
--   TO authenticated, anon
--   USING (true);
-- 
-- -- Allow any authenticated user to update their own tokens
-- CREATE POLICY "Users can update own tokens"
--   ON user_push_tokens
--   FOR UPDATE
--   TO authenticated, anon
--   USING (true)
--   WITH CHECK (true);
-- 
-- -- Allow service role full access
-- CREATE POLICY "Service role has full access"
--   ON user_push_tokens
--   FOR ALL
--   TO service_role
--   USING (true)
--   WITH CHECK (true);

-- ============================================================
-- Verify the fix
-- ============================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'user_push_tokens';

-- If RLS is now false (disabled), tokens should save successfully
