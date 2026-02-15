-- =====================================================
-- NOTIFICATION HISTORY TABLE SETUP
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Create the notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  title text not null,
  content text not null,
  type text default 'info', -- 'info', 'success', 'warning', 'error'
  data jsonb, -- Additional data (e.g., navigation payload)
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

-- 2. Create index for faster queries
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_is_read on public.notifications(is_read);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);

-- 3. Enable Row Level Security (RLS)
alter table public.notifications enable row level security;

-- 4. Create RLS policies
-- Policy: Users can view their own notifications
drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications" 
  on public.notifications 
  for select 
  using (auth.uid() = user_id);

-- Policy: Users can update (mark as read) their own notifications
drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications" 
  on public.notifications 
  for update 
  using (auth.uid() = user_id);

-- Policy: System can insert notifications (via service role key)
-- Note: This will be used by the Edge Function with service role key
drop policy if exists "Service role can insert notifications" on public.notifications;
create policy "Service role can insert notifications" 
  on public.notifications 
  for insert 
  with check (true);

-- 5. Grant permissions
grant usage on schema public to anon, authenticated;
grant select, update on public.notifications to authenticated;
grant insert on public.notifications to service_role;

-- 6. Optional: Create a function to mark all notifications as read
create or replace function mark_all_notifications_read(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.notifications
  set is_read = true
  where user_id = p_user_id and is_read = false;
end;
$$;

-- 7. Optional: Create a function to delete old notifications (cleanup)
create or replace function delete_old_notifications(days_old integer default 90)
returns integer
language plpgsql
security definer
as $$
declare
  deleted_count integer;
begin
  delete from public.notifications
  where created_at < now() - (days_old || ' days')::interval;
  
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Check if table was created successfully
select count(*) from public.notifications;

-- Insert a test notification (replace YOUR_USER_ID with actual user ID)
-- insert into public.notifications (user_id, title, content, type)
-- values ('YOUR_USER_ID', 'Test Notification', 'This is a test', 'info');

-- Fetch unread notifications for a user
-- select * from public.notifications 
-- where user_id = auth.uid() and is_read = false 
-- order by created_at desc;

-- Mark specific notification as read
-- update public.notifications set is_read = true where id = 'NOTIFICATION_ID';

-- Mark all notifications as read
-- select mark_all_notifications_read(auth.uid());

-- Delete old notifications (older than 90 days)
-- select delete_old_notifications(90);
