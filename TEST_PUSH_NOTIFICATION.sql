-- =====================================================
-- TEST PUSH NOTIFICATIONS
-- Run these queries to verify push notification setup
-- =====================================================

-- 1. Check if tokens are being saved
SELECT 
  id,
  user_id,
  substring(fcm_token, 1, 30) || '...' as token_preview,
  platform,
  device_name,
  is_active,
  created_at,
  updated_at
FROM public.user_push_tokens
ORDER BY created_at DESC
LIMIT 10;

-- Expected: You should see your device token here

-- 2. Check tokens for specific user (replace with your email)
SELECT 
  upt.id,
  u.email,
  substring(upt.fcm_token, 1, 30) || '...' as token_preview,
  upt.platform,
  upt.device_name,
  upt.is_active,
  upt.created_at
FROM public.user_push_tokens upt
JOIN auth.users u ON u.id = upt.user_id
WHERE u.email = 'your-email@example.com'  -- Replace with your email
ORDER BY upt.created_at DESC;

-- 3. Count total active tokens
SELECT 
  platform,
  COUNT(*) as active_devices
FROM public.user_push_tokens
WHERE is_active = true
GROUP BY platform;

-- 4. Get the most recent token (for testing)
SELECT 
  fcm_token,
  user_id,
  platform,
  device_name,
  created_at
FROM public.user_push_tokens
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 1;

-- Copy the fcm_token from step 4 - you'll use it to send test notification from Firebase Console

-- =====================================================
-- HOW TO SEND TEST NOTIFICATION FROM FIREBASE CONSOLE
-- =====================================================
-- 1. Go to: https://console.firebase.google.com/
-- 2. Select your project: suraksha-report
-- 3. Click "Cloud Messaging" in left menu
-- 4. Click "Send your first message" or "New campaign"
-- 5. Enter:
--    - Notification title: "Test Push Notification"
--    - Notification text: "This is a test from Firebase Console"
-- 6. Click "Send test message"
-- 7. Paste the FCM token you copied from step 4 above
-- 8. Click "Test"
-- 
-- You should receive the notification on your device immediately!

-- =====================================================
-- TROUBLESHOOTING
-- =====================================================
-- If token is not in database:
--   1. Check Chrome DevTools console for errors
--   2. Make sure app has notification permission
--   3. Check MainActivity logs for Firebase initialization
--   4. Verify google-services.json is in android/app/ folder

-- If token is saved but notification not received:
--   1. Verify token in Firebase Console is correct
--   2. Check device is connected to internet
--   3. Check notification permission is granted
--   4. Try force-stopping and reopening the app
--   5. Check FirebaseMessagingService logs in Android Studio

