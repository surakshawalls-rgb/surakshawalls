-- =====================================================
-- WHATSAPP DELIVERY TRACKING SETUP
-- =====================================================
-- Creates server-side tracking tables used by:
--   1. send-whatsapp-reminder    (stores accepted/failed sends)
--   2. whatsapp-webhook          (stores sent/delivered/read/failed webhooks)
--   3. whatsapp-message-status   (reads batch status for the UI)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- OUTGOING MESSAGE LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.whatsapp_message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL,
  batch_index INTEGER NOT NULL DEFAULT 0,
  student_id TEXT,
  student_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('template', 'text')),
  template_name TEXT,
  template_language TEXT,
  template_params JSONB NOT NULL DEFAULT '[]'::jsonb,
  text_message TEXT,
  request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  wa_message_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'accepted', 'sent', 'delivered', 'read', 'failed')),
  provider_error TEXT,
  accepted_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  last_status_at TIMESTAMPTZ,
  last_webhook_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_message_logs_batch_id
  ON public.whatsapp_message_logs(batch_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_message_logs_batch_order
  ON public.whatsapp_message_logs(batch_id, batch_index);

CREATE INDEX IF NOT EXISTS idx_whatsapp_message_logs_recipient_phone
  ON public.whatsapp_message_logs(recipient_phone);

CREATE INDEX IF NOT EXISTS idx_whatsapp_message_logs_created_at
  ON public.whatsapp_message_logs(created_at DESC);

COMMENT ON TABLE public.whatsapp_message_logs IS 'Tracks outgoing WhatsApp messages and their latest delivery state';

-- =====================================================
-- STATUS EVENT HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS public.whatsapp_message_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  message_log_id UUID REFERENCES public.whatsapp_message_logs(id) ON DELETE SET NULL,
  wa_message_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('accepted', 'sent', 'delivered', 'read', 'failed', 'unknown')),
  event_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recipient_phone TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_message_events_message_log_id
  ON public.whatsapp_message_events(message_log_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_message_events_wa_message_id
  ON public.whatsapp_message_events(wa_message_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_message_events_created_at
  ON public.whatsapp_message_events(created_at DESC);

COMMENT ON TABLE public.whatsapp_message_events IS 'Full webhook/send event history for outgoing WhatsApp messages';

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_whatsapp_message_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_whatsapp_message_logs_updated_at ON public.whatsapp_message_logs;

CREATE TRIGGER set_whatsapp_message_logs_updated_at
BEFORE UPDATE ON public.whatsapp_message_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_whatsapp_message_logs_updated_at();

-- =====================================================
-- SECURITY
-- =====================================================

ALTER TABLE public.whatsapp_message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_message_events ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies on purpose.
-- Access happens through service-role Edge Functions only.

GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.whatsapp_message_logs TO service_role;
GRANT SELECT, INSERT ON public.whatsapp_message_events TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
