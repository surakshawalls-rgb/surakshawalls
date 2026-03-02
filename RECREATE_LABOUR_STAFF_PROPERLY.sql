-- =====================================================
-- COMPLETE RESET AND RECREATE LABOUR STAFF USERS
-- =====================================================
-- This removes the manually created users and we'll use
-- Supabase Admin API to properly create them
-- =====================================================

-- Step 1: Delete manually created labour staff users
DELETE FROM public.notifications 
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'labour_staff'
);

DELETE FROM auth.users 
WHERE raw_user_meta_data->>'role' = 'labour_staff';

-- =====================================================
-- VERIFICATION: Confirm deletion
-- =====================================================
SELECT COUNT(*) as labour_staff_count 
FROM auth.users 
WHERE raw_user_meta_data->>'role' = 'labour_staff';
-- Should return 0

-- =====================================================
-- NEXT STEP: Use Supabase Dashboard to create users
-- =====================================================
-- Go to: Supabase Dashboard → Authentication → Users → Add User
-- 
-- Create 4 users with these details:
-- 
-- User 1:
--   Email: moti@surakshawalls.com
--   Password: Moti@2026
--   Auto Confirm: YES
--   
-- User 2:
--   Email: pappu@surakshawalls.com
--   Password: Pappu@2026
--   Auto Confirm: YES
--   
-- User 3:
--   Email: atul@surakshawalls.com
--   Password: Atul@2026
--   Auto Confirm: YES
--   
-- User 4:
--   Email: pathak@surakshawalls.com
--   Password: Pathak@2026
--   Auto Confirm: YES
--
-- After creating users through Dashboard, run the query below
-- =====================================================

-- =====================================================
-- FINAL STEP: Update user metadata to labour_staff role
-- =====================================================
-- Run this AFTER creating users through Supabase Dashboard
UPDATE auth.users 
SET 
    raw_user_meta_data = jsonb_build_object(
        'role', 'labour_staff',
        'full_name', CASE email
            WHEN 'moti@surakshawalls.com' THEN 'Moti'
            WHEN 'pappu@surakshawalls.com' THEN 'Pappu'
            WHEN 'atul@surakshawalls.com' THEN 'Atul'
            WHEN 'pathak@surakshawalls.com' THEN 'Pathak'
        END,
        'can_delete', false,
        'modules', ARRAY['manufacturing']::text[]
    ),
    updated_at = NOW()
WHERE email IN ('moti@surakshawalls.com', 'pappu@surakshawalls.com', 'atul@surakshawalls.com', 'pathak@surakshawalls.com');

-- =====================================================
-- ALTERNATIVE: Use Supabase Admin API (if you have access to backend)
-- =====================================================
-- If you can run Node.js/TypeScript code, use this instead:
/*

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://lcwjtwidxihclizliksd.supabase.co',
  'YOUR_SERVICE_ROLE_KEY' // Use Service Role Key, not anon key
)

const users = [
  { email: 'moti@surakshawalls.com', password: 'Moti@2026', name: 'Moti' },
  { email: 'pappu@surakshawalls.com', password: 'Pappu@2026', name: 'Pappu' },
  { email: 'atul@surakshawalls.com', password: 'Atul@2026', name: 'Atul' },
  { email: 'pathak@surakshawalls.com', password: 'Pathak@2026', name: 'Pathak' },
]

for (const user of users) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: {
      role: 'labour_staff',
      full_name: user.name,
      can_delete: false,
      modules: ['manufacturing']
    }
  })
  
  if (error) {
    console.error(`Failed to create ${user.email}:`, error)
  } else {
    console.log(`Created ${user.email}`)
  }
}

*/

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================
-- Manual INSERT into auth.users bypasses Supabase's internal
-- mechanisms and can cause "Database error querying schema".
--
-- ALWAYS use one of these methods:
-- 1. Supabase Dashboard → Authentication → Users → Add User
-- 2. Supabase Admin API (supabase.auth.admin.createUser)
-- 3. Supabase CLI
--
-- Then update raw_user_meta_data with role information
-- =====================================================
