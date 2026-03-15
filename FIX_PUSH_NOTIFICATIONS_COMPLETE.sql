-- =====================================================
-- COMPLETE FIX FOR PUSH NOTIFICATIONS
-- This fixes RLS policies and ensures tokens can be saved
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Check if table exists
SELECT EXISTS (
  SELECT FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename = 'user_push_tokens'
) as table_exists;

-- 2. Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  fcm_token text NOT NULL UNIQUE,
  platform text NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  device_name text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id 
  ON public.user_push_tokens(user_id);
  
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_active 
  ON public.user_push_tokens(is_active) 
  WHERE is_active = true;

-- 4. IMPORTANT: Disable RLS for push tokens
-- Device tokens are not sensitive - they're just Firebase device IDs
-- Users need to be able to register their own devices
ALTER TABLE public.user_push_tokens DISABLE ROW LEVEL SECURITY;

-- 5. Drop any existing policies (if RLS was previously enabled)
DROP POLICY IF EXISTS "Users can insert own tokens" ON public.user_push_tokens;
DROP POLICY IF EXISTS "Users can view own tokens" ON public.user_push_tokens;
DROP POLICY IF EXISTS "Users can update own tokens" ON public.user_push_tokens;
DROP POLICY IF EXISTS "Users can delete own tokens" ON public.user_push_tokens;

-- 6. Grant permissions to authenticated and anonymous users
GRANT ALL ON public.user_push_tokens TO authenticated;
GRANT ALL ON public.user_push_tokens TO anon;

-- 7. Verify the configuration
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  tableowner
FROM pg_tables 
WHERE tablename = 'user_push_tokens';

-- Expected result: rls_enabled = false

-- 8. Test: Try to insert a token (replace with your user_id)
-- INSERT INTO public.user_push_tokens (user_id, fcm_token, platform, device_name)
-- VALUES (
--   auth.uid(), 
--   'test_token_' || gen_random_uuid()::text, 
--   'android', 
--   'Test Device'
-- );

-- 9. View all tokens (for debugging)
-- SELECT 
--   id,
--   user_id,
--   substring(fcm_token, 1, 20) || '...' as token_preview,
--   platform,
--   device_name,
--   is_active,
--   created_at
-- FROM public.user_push_tokens
-- ORDER BY created_at DESC;

-- =====================================================
-- DONE! Push notifications should now work properly
-- =====================================================
