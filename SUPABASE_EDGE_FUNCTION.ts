// =====================================================
// SUPABASE EDGE FUNCTION: Send Push Notification
// =====================================================
// 
// Deploy this to Supabase:
// 1. Create folder: supabase/functions/send-push-notification
// 2. Save this file as: supabase/functions/send-push-notification/index.ts
// 3. Deploy: supabase functions deploy send-push-notification
// 4. Set secrets:
//    supabase secrets set FCM_SERVER_KEY=your_fcm_server_key
//    supabase secrets set APNS_KEY=your_apns_key (iOS only)
//
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  user_id: string;
  title: string;
  content: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  data?: any;
  send_push?: boolean; // If false, only save to DB
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const payload: NotificationPayload = await req.json()
    console.log('📨 Received notification request:', payload)

    // Validate payload
    if (!payload.user_id || !payload.title || !payload.content) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, title, content' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Initialize Supabase client with service role key (has full access)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // ========== STEP 1: Save notification to database ==========
    console.log('💾 Saving notification to database...')
    
    const { data: notification, error: dbError } = await supabase
      .from('notifications')
      .insert({
        user_id: payload.user_id,
        title: payload.title,
        content: payload.content,
        type: payload.type || 'info',
        data: payload.data || null,
        is_read: false
      })
      .select()
      .single()

    if (dbError) {
      console.error('❌ Database error:', dbError)
      throw new Error(`Failed to save notification: ${dbError.message}`)
    }

    console.log('✅ Notification saved to database:', notification.id)

    // ========== STEP 2: Send push notification (if enabled) ==========
    let pushResult = null
    
    if (payload.send_push !== false) {
      console.log('📱 Sending push notification...')
      
      // Get user's FCM tokens from your users table or device_tokens table
      const { data: tokens, error: tokenError } = await supabase
        .from('device_tokens')
        .select('token, platform')
        .eq('user_id', payload.user_id)
        .eq('active', true)

      if (tokenError) {
        console.warn('⚠️ Could not fetch device tokens:', tokenError.message)
      } else if (!tokens || tokens.length === 0) {
        console.warn('⚠️ No device tokens found for user')
      } else {
        console.log(`📱 Found ${tokens.length} device tokens`)
        
        // Send to each device
        const pushPromises = tokens.map(async (device) => {
          if (device.platform === 'android') {
            return sendFCMNotification(device.token, payload)
          } else if (device.platform === 'ios') {
            return sendAPNSNotification(device.token, payload)
          }
        })

        pushResult = await Promise.allSettled(pushPromises)
        console.log('✅ Push notifications sent:', pushResult)
      }
    } else {
      console.log('⏭️ Skipping push notification (send_push=false)')
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        notification_id: notification.id,
        push_sent: pushResult !== null,
        push_results: pushResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

// ========== FCM (Android) Push Notification ==========
async function sendFCMNotification(token: string, payload: NotificationPayload) {
  const fcmServerKey = Deno.env.get('FCM_SERVER_KEY')
  
  if (!fcmServerKey) {
    console.error('❌ FCM_SERVER_KEY not set')
    return { success: false, error: 'FCM not configured' }
  }

  const fcmPayload = {
    to: token,
    priority: 'high', // ⚡ High priority for instant delivery
    notification: {
      title: payload.title,
      body: payload.content,
      sound: 'default',
      badge: '1',
      android_channel_id: 'suraksha_high_priority', // Use high-priority channel
    },
    data: {
      type: payload.type || 'info',
      route: payload.data?.route || '/',
      timestamp: Date.now().toString(),
      ...payload.data
    },
    // Set expiration to 28 days (2419200 seconds) - same as GPay
    time_to_live: 2419200,
    // Don't collapse messages - deliver all notifications
    collapse_key: undefined
  }

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${fcmServerKey}`
      },
      body: JSON.stringify(fcmPayload)
    })

    const result = await response.json()
    
    if (result.success === 1) {
      console.log('✅ FCM notification sent successfully')
      return { success: true, result }
    } else {
      console.error('❌ FCM notification failed:', result)
      return { success: false, error: result }
    }
  } catch (error) {
    console.error('❌ FCM error:', error)
    return { success: false, error: error.message }
  }
}

// ========== APNs (iOS) Push Notification ==========
async function sendAPNSNotification(token: string, payload: NotificationPayload) {
  // iOS push notifications require Apple certificates
  // This is a simplified example - you'll need to implement proper APNs
  
  console.warn('⚠️ APNs not implemented yet')
  return { success: false, error: 'APNs not configured' }
  
  // Example implementation with node-apn or similar:
  // const apnsKey = Deno.env.get('APNS_KEY')
  // const apnsKeyId = Deno.env.get('APNS_KEY_ID')
  // const apnsTeamId = Deno.env.get('APNS_TEAM_ID')
  // 
  // Send via APNs HTTP/2 API with:
  // - Headers: authorization: bearer JWT_TOKEN
  // - Body: { aps: { alert: { title, body }, badge: 1, sound: 'default' }, custom: data }
  // - apns-expiration: <30 days from now>
  // - apns-priority: 10
}

/* ==============================================
   USAGE EXAMPLE FROM YOUR APP
   ==============================================

// Call this edge function from your app when you want to send a notification:

const { data, error } = await supabase.functions.invoke('send-push-notification', {
  body: {
    user_id: 'user-uuid-here',
    title: '💰 New Payment Received',
    content: '₹10,000 payment received from Client ABC',
    type: 'success',
    data: {
      route: '/sales-entry',
      transaction_id: '12345'
    },
    send_push: true
  }
})

if (error) {
  console.error('Error:', error)
} else {
  console.log('Notification sent:', data)
}

================================================= */

/* ==============================================
   DEVICE TOKENS TABLE (Create this in Supabase)
   ==============================================

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

================================================= */
