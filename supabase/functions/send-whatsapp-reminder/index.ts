// supabase/functions/send-whatsapp-reminder/index.ts
// Sends WhatsApp messages (template or text) to library students via Meta Cloud API
// and persists each request so delivery webhooks can update final status.

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN')!
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const WA_API_URL = `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type TrackingStatus = 'queued' | 'accepted' | 'sent' | 'delivered' | 'read' | 'failed'

interface StudentTarget {
  student_id?: string
  phone: string
  name: string
  expiry_date?: string
}

interface BulkRequest {
  students: StudentTarget[]
  mode: 'template' | 'text'
  template_name?: string
  template_language?: string
  template_params?: string[]
  use_student_values?: boolean
  text_message?: string
}

interface SendOutcome {
  success: boolean
  wa_message_id?: string
  error?: string
}

interface TemplateSendAttempt {
  outcome: SendOutcome
  usedLanguage: string
  attemptedLanguages: string[]
  requestPayload: Record<string, unknown>
}

interface SendResult {
  student_id?: string
  log_id?: string
  phone: string
  name: string
  success: boolean
  status: TrackingStatus
  wa_message_id?: string
  error?: string
  accepted_at?: string
  failed_at?: string
  last_status_at?: string
}

interface MessageLogInsert {
  batch_id: string
  batch_index: number
  student_id: string | null
  student_name: string
  recipient_phone: string
  mode: 'template' | 'text'
  template_name: string | null
  template_language: string | null
  template_params: string[]
  text_message: string | null
  request_payload: Record<string, unknown>
  wa_message_id: string | null
  status: TrackingStatus
  provider_error: string | null
  accepted_at: string | null
  sent_at: string | null
  delivered_at: string | null
  read_at: string | null
  failed_at: string | null
  last_status_at: string | null
  last_webhook_payload: null
}

const adminClient = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null

function buildIndianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')

  if (/^[6-9]\d{9}$/.test(digits)) {
    return `91${digits}`
  }

  if (/^0[6-9]\d{9}$/.test(digits)) {
    return `91${digits.slice(1)}`
  }

  if (/^91[6-9]\d{9}$/.test(digits)) {
    return digits
  }

  if (digits.length > 10) {
    const lastTenDigits = digits.slice(-10)
    if (/^[6-9]\d{9}$/.test(lastTenDigits)) {
      return `91${lastTenDigits}`
    }
  }

  return null
}

async function callWhatsApp(body: Record<string, unknown>): Promise<SendOutcome> {
  const res = await fetch(WA_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const json: any = await res.json()
  if (res.ok && json.messages?.[0]?.id) {
    return { success: true, wa_message_id: json.messages[0].id }
  }

  return {
    success: false,
    error: json.error?.message ?? JSON.stringify(json),
  }
}

function isMissingTemplateTranslation(error?: string): boolean {
  if (!error) return false
  return error.includes('132001') || /template name does not exist in the translation/i.test(error)
}

function buildLanguageCandidates(rawLanguage?: string): string[] {
  const language = (rawLanguage ?? '').trim()
  const candidates: string[] = []
  const push = (value: string) => {
    if (value && !candidates.includes(value)) {
      candidates.push(value)
    }
  }

  if (language) {
    push(language)

    const normalised = language.replace('-', '_')
    push(normalised)

    const [base, region] = normalised.split('_')
    if (base) {
      push(base.toLowerCase())
    }

    if (base && region) {
      push(`${base.toLowerCase()}_${region.toUpperCase()}`)
    }

    if (base?.toLowerCase() === 'en') {
      push('en_US')
    }
  }

  if (candidates.length === 0) {
    push('en_US')
  }

  return candidates
}

async function sendTemplateWithFallback(
  phone: string,
  name: string,
  language: string,
  components: Array<Record<string, unknown>>
): Promise<TemplateSendAttempt> {
  const attemptedLanguages = buildLanguageCandidates(language)

  let lastOutcome: SendOutcome = { success: false, error: 'Unknown template send failure' }
  let lastPayload: Record<string, unknown> = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name,
      language: { code: attemptedLanguages[0] ?? 'en_US' },
      ...(components.length > 0 ? { components } : {}),
    },
  }
  let usedLanguage = attemptedLanguages[0] ?? 'en_US'

  for (const candidateLanguage of attemptedLanguages) {
    const payload = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name,
        language: { code: candidateLanguage },
        ...(components.length > 0 ? { components } : {}),
      },
    }

    const outcome = await callWhatsApp(payload)
    lastOutcome = outcome
    lastPayload = payload
    usedLanguage = candidateLanguage

    if (outcome.success) {
      return {
        outcome,
        usedLanguage,
        attemptedLanguages,
        requestPayload: payload,
      }
    }

    if (!isMissingTemplateTranslation(outcome.error)) {
      break
    }
  }

  if (lastOutcome.error && attemptedLanguages.length > 1 && isMissingTemplateTranslation(lastOutcome.error)) {
    lastOutcome = {
      ...lastOutcome,
      error: `${lastOutcome.error}. Tried languages: ${attemptedLanguages.join(', ')}`,
    }
  }

  return {
    outcome: lastOutcome,
    usedLanguage,
    attemptedLanguages,
    requestPayload: lastPayload,
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function persistMessageLogs(logRows: MessageLogInsert[], results: SendResult[]) {
  if (!adminClient || logRows.length === 0) {
    return false
  }

  const { data, error } = await adminClient
    .from('whatsapp_message_logs')
    .insert(logRows)
    .select('id, batch_index, wa_message_id, last_status_at')

  if (error) {
    console.error('[send-whatsapp-reminder] Failed to persist message logs', error)
    return false
  }

  const byIndex = new Map<number, { id: string; wa_message_id: string | null; last_status_at: string | null }>()
  for (const row of data ?? []) {
    byIndex.set(row.batch_index, row)
  }

  for (const [index, result] of results.entries()) {
    const stored = byIndex.get(index)
    if (!stored) continue

    result.log_id = stored.id
    result.wa_message_id = stored.wa_message_id ?? result.wa_message_id
    result.last_status_at = stored.last_status_at ?? result.last_status_at
  }

  const acceptedEvents = results
    .map((result, index) => {
      const stored = byIndex.get(index)
      if (!stored) return null

      const eventAt = result.failed_at ?? result.accepted_at ?? result.last_status_at ?? new Date().toISOString()
      return {
        message_log_id: stored.id,
        wa_message_id: result.wa_message_id ?? null,
        event_type: result.status === 'failed' ? 'failed' : 'accepted',
        event_at: eventAt,
        recipient_phone: result.phone,
        payload: {
          source: 'send-whatsapp-reminder',
          status: result.status,
          error: result.error ?? null,
        },
      }
    })
    .filter(Boolean)

  if (acceptedEvents.length > 0) {
    const { error: eventError } = await adminClient
      .from('whatsapp_message_events')
      .insert(acceptedEvents as Record<string, unknown>[])

    if (eventError) {
      console.error('[send-whatsapp-reminder] Failed to persist message events', eventError)
    }
  }

  return true
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })
  }

  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    return new Response(
      JSON.stringify({ error: 'Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID secrets' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }

  let payload: BulkRequest
  try {
    payload = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }

  const {
    students,
    mode,
    template_name,
    template_language,
    template_params,
    use_student_values,
    text_message,
  } = payload

  if (!Array.isArray(students) || students.length === 0) {
    return new Response(
      JSON.stringify({ error: 'students array is required and must not be empty' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }

  const batchId = crypto.randomUUID()
  const results: SendResult[] = []
  const logRows: MessageLogInsert[] = []
  let templateUnavailableError: string | null = null

  for (const [index, student] of students.entries()) {
    const phone = buildIndianPhone(student.phone)

    if (!phone) {
      const statusTimestamp = new Date().toISOString()

      results.push({
        student_id: student.student_id,
        phone: student.phone,
        name: student.name,
        success: false,
        status: 'failed',
        error: 'Invalid phone number. Use a valid 10-digit Indian mobile number.',
        failed_at: statusTimestamp,
        last_status_at: statusTimestamp,
      })

      logRows.push({
        batch_id: batchId,
        batch_index: index,
        student_id: student.student_id ?? null,
        student_name: student.name,
        recipient_phone: student.phone,
        mode,
        template_name: mode === 'template' ? ((template_name ?? '').trim() || 'hello_world') : null,
        template_language: mode === 'template' ? ((template_language ?? '').trim() || 'en_US') : null,
        template_params: mode === 'template' ? (template_params ?? []) : [],
        text_message: mode === 'text' ? text_message ?? null : null,
        request_payload: {
          messaging_product: 'whatsapp',
          to: student.phone,
          type: mode,
        },
        wa_message_id: null,
        status: 'failed',
        provider_error: 'Invalid phone number. Use a valid 10-digit Indian mobile number.',
        accepted_at: null,
        sent_at: null,
        delivered_at: null,
        read_at: null,
        failed_at: statusTimestamp,
        last_status_at: statusTimestamp,
        last_webhook_payload: null,
      })

      continue
    }

    if (mode === 'template' && templateUnavailableError) {
      const statusTimestamp = new Date().toISOString()

      results.push({
        student_id: student.student_id,
        phone,
        name: student.name,
        success: false,
        status: 'failed',
        error: templateUnavailableError,
        failed_at: statusTimestamp,
        last_status_at: statusTimestamp,
      })

      logRows.push({
        batch_id: batchId,
        batch_index: index,
        student_id: student.student_id ?? null,
        student_name: student.name,
        recipient_phone: phone,
        mode,
        template_name: ((template_name ?? '').trim() || 'hello_world'),
        template_language: ((template_language ?? '').trim() || 'en_US'),
        template_params: template_params ?? [],
        text_message: null,
        request_payload: {
          messaging_product: 'whatsapp',
          to: phone,
          type: 'template',
        },
        wa_message_id: null,
        status: 'failed',
        provider_error: templateUnavailableError,
        accepted_at: null,
        sent_at: null,
        delivered_at: null,
        read_at: null,
        failed_at: statusTimestamp,
        last_status_at: statusTimestamp,
        last_webhook_payload: null,
      })

      continue
    }

    try {
      let outcome: SendOutcome
      let resolvedTemplateParams: string[] = []
      let resolvedTemplateName: string | null = null
      let resolvedTemplateLanguage: string | null = null
      let resolvedTextMessage: string | null = null
      let requestPayload: Record<string, unknown>

      if (mode === 'template') {
        const name = (template_name ?? '').trim() || 'hello_world'
        const language = (template_language ?? '').trim() || 'en_US'
        resolvedTemplateName = name

        let components: Array<Record<string, unknown>> = []
        if (template_params && template_params.length > 0) {
          resolvedTemplateParams = [...template_params]
          if (use_student_values) {
            resolvedTemplateParams = resolvedTemplateParams.map(param =>
              param === '{name}' ? student.name :
              param === '{expiry_date}' ? (student.expiry_date ?? '') :
              param === '{phone}' ? student.phone : param
            )
          }

          components = [{
            type: 'body',
            parameters: resolvedTemplateParams.map(text => ({ type: 'text', text })),
          }]
        }

        const templateAttempt = await sendTemplateWithFallback(phone, name, language, components)
        outcome = templateAttempt.outcome
        requestPayload = templateAttempt.requestPayload
        resolvedTemplateLanguage = templateAttempt.usedLanguage

        if (!outcome.success && isMissingTemplateTranslation(outcome.error)) {
          templateUnavailableError = outcome.error
            ? `${outcome.error}. Fix template name/language in WhatsApp Manager before retrying.`
            : 'Template is not available for the requested language. Fix template name/language in WhatsApp Manager before retrying.'
          outcome = {
            ...outcome,
            error: templateUnavailableError,
          }
        }
      } else if (mode === 'text') {
        if (!text_message) {
          outcome = { success: false, error: 'text_message required for text mode' }
          requestPayload = {
            messaging_product: 'whatsapp',
            to: phone,
            type: 'text',
            text: { body: '' },
          }
        } else {
          resolvedTextMessage = text_message
            .replace(/\{name\}/g, student.name)
            .replace(/\{expiry_date\}/g, student.expiry_date ?? '')
            .replace(/\{phone\}/g, student.phone)

          requestPayload = {
            messaging_product: 'whatsapp',
            to: phone,
            type: 'text',
            text: { body: resolvedTextMessage },
          }

          outcome = await callWhatsApp(requestPayload)
        }
      } else {
        outcome = { success: false, error: `Unknown mode: ${mode}` }
        requestPayload = {
          messaging_product: 'whatsapp',
          to: phone,
          type: 'unsupported',
        }
      }

      const statusTimestamp = new Date().toISOString()
      const status: TrackingStatus = outcome.success ? 'accepted' : 'failed'
      const result: SendResult = {
        student_id: student.student_id,
        phone,
        name: student.name,
        success: outcome.success,
        status,
        wa_message_id: outcome.wa_message_id,
        error: outcome.error,
        accepted_at: outcome.success ? statusTimestamp : undefined,
        failed_at: outcome.success ? undefined : statusTimestamp,
        last_status_at: statusTimestamp,
      }

      results.push(result)

      logRows.push({
        batch_id: batchId,
        batch_index: index,
        student_id: student.student_id ?? null,
        student_name: student.name,
        recipient_phone: phone,
        mode,
        template_name: mode === 'template' ? resolvedTemplateName : null,
        template_language: mode === 'template' ? resolvedTemplateLanguage : null,
        template_params: mode === 'template' ? resolvedTemplateParams : [],
        text_message: mode === 'text' ? resolvedTextMessage : null,
        request_payload: requestPayload,
        wa_message_id: outcome.wa_message_id ?? null,
        status,
        provider_error: outcome.error ?? null,
        accepted_at: outcome.success ? statusTimestamp : null,
        sent_at: null,
        delivered_at: null,
        read_at: null,
        failed_at: outcome.success ? null : statusTimestamp,
        last_status_at: statusTimestamp,
        last_webhook_payload: null,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      const statusTimestamp = new Date().toISOString()

      results.push({
        student_id: student.student_id,
        phone,
        name: student.name,
        success: false,
        status: 'failed',
        error: message,
        failed_at: statusTimestamp,
        last_status_at: statusTimestamp,
      })

      logRows.push({
        batch_id: batchId,
        batch_index: index,
        student_id: student.student_id ?? null,
        student_name: student.name,
        recipient_phone: phone,
        mode,
        template_name: mode === 'template' ? ((template_name ?? '').trim() || 'hello_world') : null,
        template_language: mode === 'template' ? ((template_language ?? '').trim() || 'en_US') : null,
        template_params: mode === 'template' ? (template_params ?? []) : [],
        text_message: mode === 'text' ? text_message ?? null : null,
        request_payload: {
          messaging_product: 'whatsapp',
          to: phone,
          type: mode,
        },
        wa_message_id: null,
        status: 'failed',
        provider_error: message,
        accepted_at: null,
        sent_at: null,
        delivered_at: null,
        read_at: null,
        failed_at: statusTimestamp,
        last_status_at: statusTimestamp,
        last_webhook_payload: null,
      })
    }

    await sleep(80)
  }

  const trackingEnabled = await persistMessageLogs(logRows, results)
  const sent = results.filter(result => result.success).length
  const failed = results.filter(result => !result.success).length

  return new Response(
    JSON.stringify({
      sent,
      failed,
      results,
      ...(trackingEnabled ? { batch_id: batchId, tracking_enabled: true } : { tracking_enabled: false }),
    }),
    { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
  )
})
