// src/app/services/whatsapp.service.ts
// Angular service that wraps the send-whatsapp-reminder Supabase Edge Function.

import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

// ── Public contracts ──────────────────────────────────────────────────────────

export type WaTrackingStatus = 'queued' | 'accepted' | 'sent' | 'delivered' | 'read' | 'failed';

export interface WaStudent {
  student_id?: string
  phone: string        // raw number from DB (service normalises it)
  name: string
  expiry_date?: string // ISO date, used for {expiry_date} substitution
}

/** Payload accepted by the Edge Function */
export interface WaBulkRequest {
  students: WaStudent[]
  mode: 'template' | 'text'

  // Template mode
  template_name?: string
  template_language?: string
  template_params?: string[]    // e.g. ['{name}', '{expiry_date}']
  use_student_values?: boolean  // expand {name}/{expiry_date} per student

  // Text mode
  text_message?: string         // supports {name} and {expiry_date} tokens
}

export interface WaResult {
  student_id?: string
  log_id?: string
  phone: string
  name: string
  success: boolean
  status: WaTrackingStatus
  wa_message_id?: string
  error?: string
  accepted_at?: string
  sent_at?: string
  delivered_at?: string
  read_at?: string
  failed_at?: string
  last_status_at?: string
}

export interface WaBulkResponse {
  sent: number
  failed: number
  results: WaResult[]
  batch_id?: string
  tracking_enabled?: boolean
}

export interface WaStatusSummary {
  queued: number
  accepted: number
  sent: number
  delivered: number
  read: number
  failed: number
}

export interface WaStatusResponse {
  batch_id: string
  all_complete: boolean
  summary: WaStatusSummary
  results: WaResult[]
}

// ── Preset message templates ──────────────────────────────────────────────────

export interface WaPreset {
  id: string
  label: string
  mode: 'template' | 'text'
  template_name?: string
  template_language?: string
  template_params?: string[]
  use_student_values?: boolean
  text_message?: string
  preview: string   // human-readable preview shown in UI
}

export const WA_PRESETS: WaPreset[] = [
  {
    id: 'hello_world',
    label: 'Hello World (test-number only)',
    mode: 'template',
    template_name: 'hello_world',
    template_language: 'en_US',
    template_params: [],
    use_student_values: false,
    preview: 'Hello World! (Only works from Meta public test numbers, not your production sender)',
  },
  {
    id: 'approved_hi_template',
    label: 'Hi (approved now)',
    mode: 'template',
    template_name: 'hi',
    template_language: 'en',
    template_params: [],
    use_student_values: false,
    preview: 'Hi',
  },
  {
    id: 'fee_reminder_template',
    label: 'Approved template',
    mode: 'template',
    template_name: 'library_fee_reminder',
    template_language: 'en_US',
    template_params: ['{name}', '{expiry_date}'],
    use_student_values: true,
    preview: 'Dear {name}, your library membership expires on {expiry_date}. Please renew to keep your seat.',
  },
  {
    id: 'fee_reminder_text',
    label: 'Fee Reminder (custom text)',
    mode: 'text',
    text_message:
      'Dear {name}, your Suraksha Library membership is expiring soon (on {expiry_date}). Please renew at the earliest to retain your seat. – Suraksha Library',
    preview:
      'Dear {name}, your Suraksha Library membership is expiring soon (on {expiry_date}). Please renew at the earliest to retain your seat. – Suraksha Library',
  },
  {
    id: 'welcome_text',
    label: 'Welcome message',
    mode: 'text',
    text_message:
      'Welcome to Suraksha Library, {name}! 📚 We\'re happy to have you. If you need any help, please contact the desk. – Suraksha Library',
    preview:
      'Welcome to Suraksha Library, {name}! 📚 We\'re happy to have you. If you need any help, please contact the desk.',
  },
  {
    id: 'custom_text',
    label: 'Custom message',
    mode: 'text',
    text_message: '',
    preview: '(Write your own message)',
  },
];

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class WhatsAppService {
  constructor(private supabase: SupabaseService) {}

  /**
   * Send bulk WhatsApp messages via the Edge Function.
   * Returns a structured result with per-student send status.
   */
  async sendBulk(request: WaBulkRequest): Promise<WaBulkResponse> {
    const { data, error } = await this.supabase.supabase.functions.invoke(
      'send-whatsapp-reminder',
      { body: request }
    );

    if (error) {
      throw new Error(`Edge function error: ${error.message ?? JSON.stringify(error)}`);
    }

    if (!data || typeof data.sent !== 'number') {
      throw new Error(`Unexpected response from Edge Function: ${JSON.stringify(data)}`);
    }

    return data as WaBulkResponse;
  }

  async getBatchStatus(batchId: string): Promise<WaStatusResponse> {
    const { data, error } = await this.supabase.supabase.functions.invoke(
      'whatsapp-message-status',
      { body: { batch_id: batchId } }
    );

    if (error) {
      throw new Error(`Status function error: ${error.message ?? JSON.stringify(error)}`);
    }

    if (!data || !Array.isArray(data.results)) {
      throw new Error(`Unexpected response from status function: ${JSON.stringify(data)}`);
    }

    return data as WaStatusResponse;
  }

  /** Build a request from an ad-hoc template preset + overrides */
  buildRequest(
    preset: WaPreset,
    students: WaStudent[],
    overrides: Partial<WaBulkRequest> = {}
  ): WaBulkRequest {
    const base: WaBulkRequest = {
      students,
      mode: preset.mode,
      template_name:       preset.template_name,
      template_language:   preset.template_language,
      template_params:     preset.template_params,
      use_student_values:  preset.use_student_values,
      text_message:        preset.text_message,
    };
    return { ...base, ...overrides };
  }

  /** Resolve preview text for a single student – for UI preview only */
  resolvePreview(text: string, student: WaStudent): string {
    return text
      .replace(/\{name\}/g, student.name)
      .replace(/\{expiry_date\}/g, student.expiry_date ?? 'N/A')
      .replace(/\{phone\}/g, student.phone);
  }

  isTerminalStatus(status?: WaTrackingStatus): boolean {
    return status === 'delivered' || status === 'read' || status === 'failed';
  }
}
