# 📬 Notification History System - Complete Setup Guide

This guide will help you implement a complete persistent notification system with:
- ✅ Database storage for permanent notification history
- ✅ Push notifications with 30-day buffer
- ✅ Auto-sync on app resume/foreground
- ✅ Beautiful notification inbox UI
- ✅ Real-time notification updates

---

## 📋 Table of Contents

1. [Database Setup](#1-database-setup)
2. [Edge Function Setup](#2-edge-function-setup)
3. [App Integration](#3-app-integration)
4. [FCM Configuration](#4-fcm-configuration)
5. [Testing](#5-testing)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Database Setup

### Step 1.1: Create Notifications Table

Run the SQL script in your Supabase SQL Editor:

```bash
# Open the file:
NOTIFICATIONS_TABLE.sql
```

This creates:
- `notifications` table with RLS policies
- Indexes for fast queries
- Helper functions (`mark_all_notifications_read`, `delete_old_notifications`)

### Step 1.2: Create Device Tokens Table

```sql
create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  token text not null unique,
  platform text not null check (platform in ('android', 'ios', 'web')),
  active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index idx_device_tokens_user_id on public.device_tokens(user_id);
create index idx_device_tokens_active on public.device_tokens(active);

alter table public.device_tokens enable row level security;

create policy "Users can manage their own tokens" 
  on public.device_tokens 
  for all 
  using (auth.uid() = user_id);
```

### Step 1.3: Verify Tables Created

```sql
-- Check notifications table
select count(*) from public.notifications;

-- Check device_tokens table
select count(*) from public.device_tokens;
```

---

## 2. Edge Function Setup

### Step 2.1: Install Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 2.2: Create Edge Function

```bash
# Create function directory
supabase functions new send-push-notification

# Copy the template
# Copy contents from SUPABASE_EDGE_FUNCTION.ts
# to supabase/functions/send-push-notification/index.ts
```

### Step 2.3: Set Environment Variables

```bash
# Set FCM server key (get from Firebase Console)
supabase secrets set FCM_SERVER_KEY=your_fcm_server_key

# Set APNs key (iOS only - optional for now)
# supabase secrets set APNS_KEY=your_apns_key
```

### Step 2.4: Deploy Function

```bash
# Deploy the function
supabase functions deploy send-push-notification

# Test the function
supabase functions invoke send-push-notification \
  --body '{"user_id":"test-user-id","title":"Test","content":"Hello"}'
```

---

## 3. App Integration

### Step 3.1: Add Notification Inbox Component

The component has already been created at:
```
src/app/components/notification-inbox/
  ├── notification-inbox.component.ts
  ├── notification-inbox.component.html
  └── notification-inbox.component.css
```

### Step 3.2: Import Component in App Toolbar

Update `src/app/app.html` to add the notification bell:

```html
<mat-toolbar color="primary" class="app-toolbar">
  <button mat-icon-button (click)="drawer.toggle()">
    <mat-icon>menu</mat-icon>
  </button>
  
  <span class="app-title">{{ getPageTitle() }}</span>
  
  <span class="spacer"></span>
  
  <!-- ADD THIS: Notification Bell -->
  <app-notification-inbox></app-notification-inbox>
  
  <!-- Profile Menu -->
  <button mat-icon-button [matMenuTriggerFor]="profileMenu">
    <mat-icon>account_circle</mat-icon>
  </button>
</mat-toolbar>
```

Update `src/app/app.ts` imports:

```typescript
import { NotificationInboxComponent } from './components/notification-inbox/notification-inbox.component';

@Component({
  // ... existing config
  imports: [
    // ... existing imports
    NotificationInboxComponent  // ADD THIS
  ]
})
```

### Step 3.3: Update Push Notification Service

Update `src/app/services/push-notification.service.ts` to save FCM token:

```typescript
// In the registration listener (around line 90)
PushNotifications.addListener('registration', async (token: Token) => {
  console.log('📱 FCM Token:', token.value);
  
  // Save token to backend
  await this.saveTokenToBackend(token.value);
});

// Add this method
private async saveTokenToBackend(token: string): Promise<void> {
  try {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return;

    // Upsert device token
    const { error } = await this.supabase
      .from('device_tokens')
      .upsert({
        user_id: user.id,
        token: token,
        platform: 'android',  // or 'ios'
        active: true
      }, {
        onConflict: 'token'
      });

    if (error) {
      console.error('❌ Error saving token:', error);
    } else {
      console.log('✅ Device token saved to database');
    }
  } catch (error) {
    console.error('❌ Exception saving token:', error);
  }
}
```

### Step 3.4: App Resume Functionality

Already implemented in `src/app/app.ts`:

- ✅ Listens to page visibility changes (web)
- ✅ Listens to Capacitor app state changes (mobile)
- ✅ Listens to network online events
- ✅ Auto-syncs missed notifications

---

## 4. FCM Configuration

### Step 4.1: Get FCM Server Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Cloud Messaging**
4. Copy the **Server key**

### Step 4.2: Configure Android App

Already configured in your project:
```
android/
  ├── google-services.json  (✅ Already exists)
  └── app/build.gradle       (✅ Already configured)
```

### Step 4.3: Update FCM Settings for Long TTL

In your edge function (`SUPABASE_EDGE_FUNCTION.ts`), the FCM payload is already configured with:

```typescript
{
  time_to_live: 2592000  // 30 days in seconds
}
```

This ensures notifications are buffered for 30 days if the device is offline.

### Step 4.4: Avoid Collapse Keys (Android)

In the edge function, we're NOT using `collapse_key`, which means:
- ✅ Every notification will be delivered
- ✅ Multiple notifications won't replace each other
- ✅ User sees all missed notifications

If you want only the latest notification, add:
```typescript
collapse_key: 'library_update'  // Same key = only latest delivered
```

---

## 5. Testing

### Test 1: Manual Notification Insert

```sql
-- Insert a test notification
insert into public.notifications (user_id, title, content, type)
values (
  (select id from auth.users limit 1),
  'Test Notification',
  'This is a test message',
  'info'
);
```

Open your app → should see the notification in the bell icon.

### Test 2: Edge Function Call

```typescript
// In any component
async testNotification() {
  const { data, error } = await this.supabase.functions.invoke('send-push-notification', {
    body: {
      user_id: this.userId,
      title: '💰 Test Payment',
      content: '₹10,000 received',
      type: 'success',
      data: {
        route: '/dashboard'
      },
      send_push: true
    }
  });

  console.log('Result:', data, error);
}
```

### Test 3: App Resume Sync

1. Open the app
2. Insert notifications while app is in background:
   ```sql
   insert into public.notifications (user_id, title, content)
   values (auth.uid(), 'Missed Message', 'You missed this!', 'warning');
   ```
3. Bring app to foreground
4. Should see toast notifications for missed messages

### Test 4: Push Notification (Offline Device)

1. Turn off device WiFi/mobile data
2. Send notification via edge function
3. Wait 5 minutes
4. Turn on WiFi/mobile data
5. Should receive the notification (buffered by FCM for 30 days)

---

## 6. Troubleshooting

### Problem: No notifications showing

**Check:**
```sql
-- Verify notifications exist
select * from public.notifications 
where user_id = auth.uid() 
order by created_at desc;

-- Check RLS policies
select * from pg_policies 
where tablename = 'notifications';
```

**Fix:**
- Ensure user is logged in
- Verify RLS policies are active
- Check browser console for errors

### Problem: Push notifications not received

**Check:**
1. FCM token saved?
   ```sql
   select * from public.device_tokens 
   where user_id = auth.uid();
   ```

2. Edge function deployed?
   ```bash
   supabase functions list
   ```

3. FCM server key set?
   ```bash
   supabase secrets list
   ```

**Fix:**
- Ensure `saveTokenToBackend()` is called
- Verify FCM server key is correct
- Check Supabase edge function logs

### Problem: App resume not syncing

**Check browser/Logcat:**
```
📱 App came to foreground (web/mobile)
🔄 Syncing missed notifications...
```

**Fix:**
- Ensure listeners are registered
- Check if Capacitor is installed: `npm list @capacitor/app`
- Verify app.ts has `setupAppStateListeners()`

### Problem: Edge function errors

**View logs:**
```bash
supabase functions logs send-push-notification
```

**Common issues:**
- Missing FCM_SERVER_KEY secret
- Invalid user_id
- Database connection issues

---

## 7. Usage Examples

### Example 1: Send Notification on Fee Payment

```typescript
// In library.service.ts after successful payment
async recordFeePayment(payment: any) {
  // ... existing payment logic ...

  // Send notification
  await this.supabase.functions.invoke('send-push-notification', {
    body: {
      user_id: this.currentUserId,
      title: '💰 Fee Payment Received',
      content: `₹${payment.amount_paid} received from ${studentName}`,
      type: 'success',
      data: {
        route: '/library-grid',
        payment_id: paymentId
      },
      send_push: true
    }
  });
}
```

### Example 2: Send Notification on New Student Registration

```typescript
// In library-grid.component.ts
async processRegistration() {
  // ... existing registration logic ...

  // Notify library manager
  await this.supabase.functions.invoke('send-push-notification', {
    body: {
      user_id: libraryManagerId,
      title: '👨‍🎓 New Student Registered',
      content: `${student.name} enrolled in ${shift}`,
      type: 'info',
      data: {
        route: '/library-students',
        student_id: student.id
      }
    }
  });
}
```

### Example 3: Batch Notifications

```typescript
// Send to multiple users
const userIds = ['user1', 'user2', 'user3'];

await Promise.all(
  userIds.map(userId =>
    this.supabase.functions.invoke('send-push-notification', {
      body: {
        user_id: userId,
        title: '📢 Important Update',
        content: 'System maintenance scheduled for tonight',
        type: 'warning'
      }
    })
  )
);
```

---

## 8. Advanced Features

### Feature 1: Mark Notification as Read on Click

Already implemented in `notification-inbox.component.ts`:

```typescript
handleNotificationClick(notification: NotificationRecord) {
  this.markAsRead(notification);
  
  if (notification.data?.route) {
    this.router.navigate([notification.data.route]);
  }
}
```

### Feature 2: Delete Old Notifications (Cleanup)

Run this periodically (cron job or manual):

```sql
-- Delete notifications older than 90 days
select delete_old_notifications(90);
```

### Feature 3: Notification Preferences

Add a settings page where users can toggle notification types:

```typescript
interface NotificationPreferences {
  fee_payments: boolean;
  new_students: boolean;
  expenses: boolean;
  // ...
}
```

Store in user metadata or separate table.

---

## 9. Next Steps

✅ **Completed:**
- Database tables created
- Notification service with inbox methods
- Beautiful UI component
- App resume listeners
- Edge function template

🚀 **Deploy Now:**
1. Run `NOTIFICATIONS_TABLE.sql` in Supabase
2. Deploy edge function
3. Build and install new APK
4. Test notifications!

📝 **Future Enhancements:**
- Add notification categories
- Add notification sounds/vibrations
- Add notification scheduling
- Add notification analytics
- Add bulk actions (delete all, archive)

---

## 10. Support

If you encounter issues:

1. Check browser console (F12)
2. Check Supabase logs
3. Check Logcat (Android): `adb logcat | grep -i notification`
4. Verify all environment variables set
5. Ensure all tables have proper RLS policies

---

## Files Reference

- `NOTIFICATIONS_TABLE.sql` - Database schema
- `SUPABASE_EDGE_FUNCTION.ts` - Push notification sender
- `src/app/services/notification.service.ts` - Notification service
- `src/app/components/notification-inbox/` - Inbox UI
- `src/app/app.ts` - App resume listeners

---

**🎉 That's it! You now have a complete notification system with:**
- ✅ Persistent storage (never lose a notification)
- ✅ 30-day push buffering (offline users get notifications)
- ✅ Auto-sync on app resume (catch up on missed notifications)
- ✅ Beautiful inbox UI (Material Design)
- ✅ Real-time updates (instant notifications)

Enjoy! 🚀
