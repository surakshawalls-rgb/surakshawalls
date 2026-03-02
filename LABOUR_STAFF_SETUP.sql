-- =====================================================
-- LABOUR STAFF USER SETUP
-- =====================================================
-- This script creates or updates users with the 'labour_staff' role
-- Labour staff users have access ONLY to:
--   - Daily Entry page
--   - Production section (add/view production records)
--   - Labor section (add/view labor records)
-- 
-- Labour staff users CANNOT see:
--   - Sales section
--   - Other Expenses section
--   - Production Damage section
--   - Summary & Submit section
--   - Library pages
-- =====================================================

-- METHOD 1: Create a new labour staff user
-- Replace the email, password, and full_name with actual values
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'moti@surakshawalls.com',
    crypt('Moti@2026', gen_salt('bf')),
    NOW(),
    jsonb_build_object(
        'role', 'labour_staff',
        'full_name', 'Moti',
        'can_delete', false,
        'modules', ARRAY['manufacturing']::text[]
    ),
    NOW(),
    NOW(),
    '',
    ''
);

-- =====================================================

-- METHOD 2: Update an existing user to become labour staff
-- Use this if you want to convert an existing user to labour_staff role
UPDATE auth.users 
SET 
    raw_user_meta_data = jsonb_build_object(
        'role', 'labour_staff',
        'full_name', 'Moti',
        'can_delete', false,
        'modules', ARRAY['manufacturing']::text[]
    ),
    updated_at = NOW()
WHERE email = 'moti@surakshawalls.com';  -- Replace with actual email

-- =====================================================

-- METHOD 3: Create multiple labour staff users at once
-- NOTE: If users already exist, consider using METHOD 2 (UPDATE) instead to avoid foreign key issues
-- This will delete all related records (notifications, etc.) before recreating users

-- Delete related records first
DELETE FROM public.notifications 
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email IN ('moti@surakshawalls.com', 'pappu@surakshawalls.com', 'atul@surakshawalls.com', 'pathak@surakshawalls.com')
);

-- Delete existing users
DELETE FROM auth.users 
WHERE email IN ('moti@surakshawalls.com', 'pappu@surakshawalls.com', 'atul@surakshawalls.com', 'pathak@surakshawalls.com');

-- Now create the users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
)
VALUES 
    (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'moti@surakshawalls.com',
        crypt('Moti@2026', gen_salt('bf')),
        NOW(),
        jsonb_build_object('role', 'labour_staff', 'full_name', 'Moti', 'can_delete', false, 'modules', ARRAY['manufacturing']::text[]),
        NOW(),
        NOW(),
        '',
        ''
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'pappu@surakshawalls.com',
        crypt('Pappu@2026', gen_salt('bf')),
        NOW(),
        jsonb_build_object('role', 'labour_staff', 'full_name', 'Pappu', 'can_delete', false, 'modules', ARRAY['manufacturing']::text[]),
        NOW(),
        NOW(),
        '',
        ''
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'atul@surakshawalls.com',
        crypt('Atul@2026', gen_salt('bf')),
        NOW(),
        jsonb_build_object('role', 'labour_staff', 'full_name', 'Atul', 'can_delete', false, 'modules', ARRAY['manufacturing']::text[]),
        NOW(),
        NOW(),
        '',
        ''
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'pathak@surakshawalls.com',
        crypt('Pathak@2026', gen_salt('bf')),
        NOW(),
        jsonb_build_object('role', 'labour_staff', 'full_name', 'Pathak', 'can_delete', false, 'modules', ARRAY['manufacturing']::text[]),
        NOW(),
        NOW(),
        '',
        ''
    );

-- =====================================================

-- METHOD 3A: Update existing users to labour_staff (SAFER - No deletion)
-- Use this if users already exist and you don't want to delete them
UPDATE auth.users 
SET 
    raw_user_meta_data = CASE email
        WHEN 'moti@surakshawalls.com' THEN jsonb_build_object('role', 'labour_staff', 'full_name', 'Moti', 'can_delete', false, 'modules', ARRAY['manufacturing']::text[])
        WHEN 'pappu@surakshawalls.com' THEN jsonb_build_object('role', 'labour_staff', 'full_name', 'Pappu', 'can_delete', false, 'modules', ARRAY['manufacturing']::text[])
        WHEN 'atul@surakshawalls.com' THEN jsonb_build_object('role', 'labour_staff', 'full_name', 'Atul', 'can_delete', false, 'modules', ARRAY['manufacturing']::text[])
        WHEN 'pathak@surakshawalls.com' THEN jsonb_build_object('role', 'labour_staff', 'full_name', 'Pathak', 'can_delete', false, 'modules', ARRAY['manufacturing']::text[])
    END,
    encrypted_password = CASE email
        WHEN 'moti@surakshawalls.com' THEN crypt('Moti@2026', gen_salt('bf'))
        WHEN 'pappu@surakshawalls.com' THEN crypt('Pappu@2026', gen_salt('bf'))
        WHEN 'atul@surakshawalls.com' THEN crypt('Atul@2026', gen_salt('bf'))
        WHEN 'pathak@surakshawalls.com' THEN crypt('Pathak@2026', gen_salt('bf'))
    END,
    updated_at = NOW()
WHERE email IN ('moti@surakshawalls.com', 'pappu@surakshawalls.com', 'atul@surakshawalls.com', 'pathak@surakshawalls.com');

-- =====================================================

-- VERIFICATION: View all labour staff users
SELECT 
    id,
    email,
    raw_user_meta_data->>'full_name' as full_name,
    raw_user_meta_data->>'role' as role,
    created_at,
    email_confirmed_at
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'labour_staff'
ORDER BY created_at DESC;

-- =====================================================

-- CLEANUP: Remove a labour staff user (if needed)
-- DELETE FROM auth.users WHERE email = 'moti@surakshawalls.com';

-- REVERT: Change labour staff back to viewer role
-- UPDATE auth.users 
-- SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', '"viewer"'),
--     updated_at = NOW() 
-- WHERE email = 'moti@surakshawalls.com';

-- =====================================================
-- IMPORTANT NOTES:
-- =====================================================
-- 1. The password is encrypted using bcrypt (crypt function with gen_salt('bf'))
-- 2. Password format: First letter capitalized + name + @2026
--    Example: moti → Moti@2026, pappu → Pappu@2026
-- 3. Created labour staff users:
--    - moti@surakshawalls.com (Password: Moti@2026)
--    - pappu@surakshawalls.com (Password: Pappu@2026)
--    - atul@surakshawalls.com (Password: Atul@2026)
--    - pathak@surakshawalls.com (Password: Pathak@2026)
-- 4. Custom user fields (role, full_name, can_delete, modules) are stored in 
--    raw_user_meta_data as JSON in Supabase auth.users table
-- 5. Labour staff can only access /daily-entry route
-- 6. They will see ONLY Production and Labor sections
-- 7. All other sections (Sales, Expenses, Damage, Summary) are hidden
-- 8. They cannot access library, reports, or other administrative pages
-- 9. The 'role' field in auth.users is 'authenticated' (Supabase Auth requirement)
--    The actual user role is stored in raw_user_meta_data->>'role'
-- 
-- RECOMMENDED APPROACH:
-- - For NEW users: Use METHOD 3 (creates fresh users)
-- - For EXISTING users: Use METHOD 3A (safer - just updates metadata and password)
-- =====================================================
