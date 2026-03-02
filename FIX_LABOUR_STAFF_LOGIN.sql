-- =====================================================
-- FIX LABOUR STAFF LOGIN ISSUE
-- =====================================================
-- This script fixes the login issue by ensuring all required
-- Supabase auth.users fields are properly set
-- =====================================================

-- Update labour staff users with all required fields
UPDATE auth.users 
SET 
    -- Ensure confirmation tokens are NULL not empty string
    confirmation_token = NULL,
    recovery_token = NULL,
    email_change_token_new = NULL,
    email_change = NULL,
    
    -- Set app metadata (required by Supabase)
    raw_app_meta_data = jsonb_build_object(
        'provider', 'email',
        'providers', ARRAY['email']::text[]
    ),
    
    -- Ensure these timestamps exist
    last_sign_in_at = NULL,
    confirmation_sent_at = NULL,
    recovery_sent_at = NULL,
    email_change_sent_at = NULL,
    email_change_token_current = NULL,
    email_change_confirm_status = 0,
    
    -- Ensure email is confirmed
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    
    -- Set is_sso_user
    is_sso_user = false,
    
    -- Update timestamp
    updated_at = NOW()
WHERE raw_user_meta_data->>'role' = 'labour_staff';

-- =====================================================
-- VERIFICATION: Check the updated users
-- =====================================================
SELECT 
    email,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'full_name' as full_name,
    email_confirmed_at,
    raw_app_meta_data,
    confirmation_token,
    is_sso_user
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'labour_staff';

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. This sets all required Supabase auth fields
-- 2. confirmation_token and recovery_token are set to NULL (not empty string)
-- 3. raw_app_meta_data is set with email provider info
-- 4. is_sso_user is set to false
-- 5. email_confirmed_at is ensured to be set
-- 
-- After running this, try logging in again with:
--   Email: moti@surakshawalls.com
--   Password: Moti@2026
-- =====================================================
