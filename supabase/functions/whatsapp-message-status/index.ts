import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from '@supabase/supabase-js'

declare const Deno: {
  env: { get(name: string): string | undefined }
  serve(handler: (req: Request) => Response | Promise<Response>): void
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type TrackingStatus = 'queued' | 'accepted' | 'sent' | 'delivered' | 'read' | 'failed'

const adminClient = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null

function emptySummary() {
  return {
    queued: 0,
    accepted: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })
  }

  if (!adminClient) {
    return new Response(
      JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }

  let batchId = ''

  if (req.method === 'GET') {
    const url = new URL(req.url)
    batchId = url.searchParams.get('batch_id') ?? ''
  } else {
    try {
      const body = await req.json()
      batchId = body?.batch_id ?? ''
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }
  }

  if (!batchId) {
    return new Response(
      JSON.stringify({ error: 'batch_id is required' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }

  const { data, error } = await adminClient
    .from('whatsapp_message_logs')
    .select(`
      id,
      batch_id,
      batch_index,
      student_id,
      student_name,
      recipient_phone,
      status,
      provider_error,
      wa_message_id,
      accepted_at,
      sent_at,
      delivered_at,
      read_at,
      failed_at,
      last_status_at,
      created_at
    `)
    .eq('batch_id', batchId)
    .order('batch_index', { ascending: true })

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }

  const summary = emptySummary()
  const results = (data ?? []).map((row: any) => {
    const status = (row.status ?? 'queued') as TrackingStatus
    summary[status] += 1

    return {
      student_id: row.student_id ?? undefined,
      log_id: row.id,
      phone: row.recipient_phone,
      name: row.student_name,
      success: status !== 'failed',
      status,
      wa_message_id: row.wa_message_id ?? undefined,
      error: row.provider_error ?? undefined,
      accepted_at: row.accepted_at ?? undefined,
      sent_at: row.sent_at ?? undefined,
      delivered_at: row.delivered_at ?? undefined,
      read_at: row.read_at ?? undefined,
      failed_at: row.failed_at ?? undefined,
      last_status_at: row.last_status_at ?? row.created_at ?? undefined,
    }
  })

  const allComplete = results.length > 0
    && results.every((result: any) => ['delivered', 'read', 'failed'].includes(result.status))

  return new Response(
    JSON.stringify({
      batch_id: batchId,
      summary,
      all_complete: allComplete,
      results,
    }),
    { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
  )
})
