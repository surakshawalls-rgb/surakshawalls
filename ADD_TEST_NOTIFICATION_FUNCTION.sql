-- =====================================================
-- ADD TEST NOTIFICATION FUNCTION
-- This allows authenticated users to create test notifications
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create function to send test notification
-- Uses SECURITY DEFINER to bypass RLS and allow authenticated users to insert
create or replace function send_test_notification()
returns jsonb
language plpgsql
security definer -- This runs with creator's privileges, bypassing RLS
set search_path = public
as $$
declare
  new_notification_id uuid;
  current_user_id uuid;
begin
  -- Get the current authenticated user
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  if current_user_id is null then
    return jsonb_build_object(
      'success', false,
      'error', 'User not authenticated'
    );
  end if;
  
  -- Insert test notification
  insert into public.notifications (user_id, title, content, type, data)
  values (
    current_user_id,
    'Test Notification',
    'This is a test notification sent at ' || now()::text,
    'info',
    jsonb_build_object('test', true, 'timestamp', now())
  )
  returning id into new_notification_id;
  
  -- Return success response
  return jsonb_build_object(
    'success', true,
    'notification_id', new_notification_id
  );
exception
  when others then
    return jsonb_build_object(
      'success', false,
      'error', sqlerrm
    );
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function send_test_notification() to authenticated;

-- =====================================================
-- USAGE
-- =====================================================
-- Test the function (run in Supabase SQL Editor while logged in):
-- select send_test_notification();
