import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from '@supabase/supabase-js'

declare const Deno: {
  env: { get(name: string): string | undefined }
  serve(handler: (req: Request) => Response | Promise<Response>): void
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const VERIFY_TOKEN = Deno.env.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN') ?? ''

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type TrackingStatus = 'queued' | 'accepted' | 'sent' | 'delivered' | 'read' | 'failed'

interface WebhookStatusEvent {
  wa_message_id: string
  status: TrackingStatus
  recipient_phone: string | null
  occurred_at: string
  error_message: string | null
  payload: Record<string, unknown>
}

const adminClient = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null

function mapStatus(rawStatus: string | undefined): TrackingStatus | null {
  switch (rawStatus) {
    case 'sent':
      return 'sent'
    case 'delivered':
      return 'delivered'
    case 'read':
      return 'read'
    case 'failed':
      return 'failed'
    default:
      return null
  }
}

function extractErrorMessage(statusPayload: any): string | null {
  if (!Array.isArray(statusPayload?.errors) || statusPayload.errors.length === 0) {
    return null
  }

  return statusPayload.errors
    .map((entry: any) => [
      entry?.code,
      entry?.title,
      entry?.message,
      entry?.error_data?.details,
    ].filter(Boolean).join(': '))
    .filter(Boolean)
    .join(' | ')
}

function shouldApplyStatus(currentStatus: TrackingStatus | null, incomingStatus: TrackingStatus): boolean {
  if (!currentStatus) return true

  if (incomingStatus === 'failed') {
    return currentStatus !== 'delivered' && currentStatus !== 'read'
  }

  if (currentStatus === 'failed') {
    return true
  }

  const rank: Record<TrackingStatus, number> = {
    queued: 0,
    accepted: 1,
    sent: 2,
    delivered: 3,
    read: 4,
    failed: 1,
  }

  return rank[incomingStatus] >= rank[currentStatus]
}

function toIsoTimestamp(unixTimestamp?: string): string {
  const seconds = Number(unixTimestamp)
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return new Date().toISOString()
  }

  return new Date(seconds * 1000).toISOString()
}

function extractStatusEvents(payload: any): WebhookStatusEvent[] {
  const events: WebhookStatusEvent[] = []

  for (const entry of payload?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      for (const statusPayload of change?.value?.statuses ?? []) {
        const mappedStatus = mapStatus(statusPayload?.status)
        const waMessageId = statusPayload?.id

        if (!mappedStatus || !waMessageId) {
          continue
        }

        events.push({
          wa_message_id: waMessageId,
          status: mappedStatus,
          recipient_phone: statusPayload?.recipient_id ?? null,
          occurred_at: toIsoTimestamp(statusPayload?.timestamp),
          error_message: extractErrorMessage(statusPayload),
          payload: statusPayload,
        })
      }
    }
  }

  return events
}

async function storeEvent(event: WebhookStatusEvent) {
  if (!adminClient) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const { data, error } = await adminClient
    .from('whatsapp_message_logs')
    .select('id, status, sent_at, delivered_at, read_at, failed_at')
    .eq('wa_message_id', event.wa_message_id)
    .limit(1)

  if (error) {
    console.error('[whatsapp-webhook] Failed to fetch tracked message', error)
  }

  const existing = data?.[0]
  const messageLogId = existing?.id ?? null

  if (existing) {
    const updates: Record<string, unknown> = {
      last_status_at: event.occurred_at,
      last_webhook_payload: event.payload,
    }

    if (shouldApplyStatus(existing.status ?? null, event.status)) {
      updates.status = event.status
    }

    if (event.status === 'sent' && !existing.sent_at) {
      updates.sent_at = event.occurred_at
    }

    if (event.status === 'delivered' && !existing.delivered_at) {
      updates.delivered_at = event.occurred_at
    }

    if (event.status === 'read' && !existing.read_at) {
      updates.read_at = event.occurred_at
    }

    if (event.status === 'failed') {
      if (!existing.failed_at) {
        updates.failed_at = event.occurred_at
      }
      if (event.error_message) {
        updates.provider_error = event.error_message
      }
    }

    const { error: updateError } = await adminClient
      .from('whatsapp_message_logs')
      .update(updates)
      .eq('id', existing.id)

    if (updateError) {
      console.error('[whatsapp-webhook] Failed to update tracked message', updateError)
    }
  }

  const { error: eventError } = await adminClient
    .from('whatsapp_message_events')
    .insert([{
      message_log_id: messageLogId,
      wa_message_id: event.wa_message_id,
      event_type: event.status,
      event_at: event.occurred_at,
      recipient_phone: event.recipient_phone,
      payload: event.error_message
        ? { ...event.payload, provider_error: event.error_message }
        : event.payload,
    }])

  if (eventError) {
    console.error('[whatsapp-webhook] Failed to persist webhook event', eventError)
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  const url = new URL(req.url)

  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode')
    const verifyToken = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    if (!VERIFY_TOKEN) {
      return new Response('Missing WHATSAPP_WEBHOOK_VERIFY_TOKEN', { status: 500 })
    }

    if (mode === 'subscribe' && verifyToken === VERIFY_TOKEN && challenge) {
      return new Response(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    return new Response('Forbidden', { status: 403 })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })
  }

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return new Response('Invalid JSON payload', { status: 400, headers: CORS_HEADERS })
  }

  if (!adminClient) {
    return new Response('Missing Supabase admin client configuration', { status: 500, headers: CORS_HEADERS })
  }

  const events = extractStatusEvents(payload)

  for (const event of events) {
    await storeEvent(event)
  }

  return new Response('EVENT_RECEIVED', {
    status: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'text/plain' },
  })
})
