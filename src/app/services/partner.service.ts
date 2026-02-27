import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class PartnerService {

  constructor(private supabase: SupabaseService) {}

  async getAllPartners() {
    const { data, error } = await this.supabase.supabase
      .from('partner_master')
      .select('*')
      .order('name');

    if (error) {
      console.error('[PartnerService] getAllPartners error:', error);
      return [];
    }

    return data || [];
  }

  insertExpense(date: string, partner_id: string, title: string, amount: number, category: string, description?: string) {
    // Record partner contribution in firm_cash_ledger
    return this.supabase.supabase.from('firm_cash_ledger').insert([{
      date,
      type: 'receipt',
      category: 'partner_contribution',
      partner_id,
      amount,
      description: `${title} - ${category}${description ? ': ' + description : ''}`
    }]);
  }

  getExpenses(from: number, to: number) {
    return this.supabase.supabase
      .from('firm_cash_ledger')
      .select('date, partner_id, amount, description')
      .eq('type', 'receipt')
      .eq('category', 'partner_contribution')
      .order('created_at', { ascending: false })
      .range(from, to);
  }
}
